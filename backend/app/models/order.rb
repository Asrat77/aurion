class Order < ApplicationRecord
  # Integer values are load-bearing: they are already stored in the database.
  # 2 was previously named `fulfilled`, which conflated "vendor is preparing it"
  # with "buyer has it" — it is now the explicit `processing` step of the
  # confirmed → processing → shipped → delivered timeline.
  STATUSES = {
    pending: 0,
    paid: 1,
    processing: 2,
    cancelled: 3,
    shipped: 4,
    delivered: 5,
    refunded: 6
  }.freeze

  # Orders that represent real, recognisable revenue. Cancelled and refunded
  # orders are excluded; every dashboard and payout figure derives from this so
  # the lifecycle can grow without hunting down status arrays.
  SETTLED_STATUSES = %w[paid processing shipped delivered].freeze

  belongs_to :buyer, class_name: "User"
  has_many :order_items, dependent: :destroy
  has_many :order_events, dependent: :destroy

  enum :status, STATUSES

  validates :subtotal_cents, :shipping_cents, :tax_cents, :total_cents,
            numericality: { greater_than_or_equal_to: 0 }

  scope :settled, -> { where(status: SETTLED_STATUSES) }

  def reference
    "AUR-#{id.to_s.rjust(6, '0')}"
  end

  def settled?
    SETTLED_STATUSES.include?(status)
  end

  def transition_error
    @transition_error
  end

  # Cancellable right up until a vendor hands the goods to a carrier.
  def cancellable?
    return true if pending?
    return false unless settled?

    order_items.none? { |i| i.fulfillment_shipped? || i.fulfillment_delivered? }
  end

  # Every *_cents column on an order is denominated in the platform's base
  # currency (USD). `currency` and `fx_rate` describe how the buyer sees and
  # pays for it — an Ethiopian buyer is quoted birr at the recorded rate. Base
  # cents stay comparable across orders, which is what admin revenue, vendor
  # payouts and analytics all sum over. A live gateway charges this amount:
  def charge_amount_cents
    (total_cents * fx_rate).round
  end

  # Idempotent: only transitions pending -> paid, and only ever creates one
  # payout per order_item (guarded by the unique index on order_item_id).
  def mark_paid!(payment_method: nil, payment_ref: nil)
    return true if settled?
    return false unless pending?

    transaction do
      update!(
        status: :paid,
        paid_at: Time.current,
        payment_method: payment_method || self.payment_method,
        payment_ref: payment_ref || self.payment_ref,
      )
      order_items.each do |item|
        Payout.find_or_create_by!(order_item: item) do |payout|
          payout.vendor = item.vendor
          payout.amount_cents = item.net_cents
          payout.status = :pending
        end
      end
      record_event!("Payment confirmed", note: "Order confirmed and sent to vendors")
    end
    true
  end

  # Advances one vendor's line, then recomputes the order-level status from all
  # of them. Returns false with #transition_error rather than raising, so
  # controllers can render a useful message.
  def advance_item!(item, next_status, actor: nil, carrier: nil, tracking_number: nil)
    unless settled?
      @transition_error = "This order is #{status}, so its items cannot be updated."
      return false
    end

    unless item.can_advance_to?(next_status)
      @transition_error = "An item that is #{item.fulfillment_status} cannot move to #{next_status}."
      return false
    end

    transaction do
      item.advance_to!(next_status, carrier: carrier, tracking_number: tracking_number)
      record_event!(
        item_event_label(next_status),
        actor: actor,
        order_item: item,
        note: tracking_number.presence && "#{carrier.presence || 'Tracking'}: #{tracking_number}"
      )
      sync_fulfillment_status!
    end
    true
  end

  # A buyer or admin calling the order off. Allowed until something has shipped,
  # because at that point the goods are already in transit.
  def cancel!(actor: nil, note: nil)
    if pending?
      transaction do
        update!(status: :cancelled, cancelled_at: Time.current)
        release_stock!
        record_event!("Cancelled", actor: actor, note: note || "Cancelled before payment")
      end
      return true
    end

    unless settled?
      @transition_error = "An order that is #{status} cannot be cancelled."
      return false
    end

    if order_items.any? { |i| i.fulfillment_shipped? || i.fulfillment_delivered? }
      @transition_error = "This order has already shipped and can no longer be cancelled."
      return false
    end

    transaction do
      order_items.each { |i| i.update!(fulfillment_status: :cancelled) }
      update!(status: :cancelled, cancelled_at: Time.current)
      release_stock!
      Payout.where(order_item: order_items).destroy_all
      record_event!("Cancelled", actor: actor, note: note || "Cancelled after payment")
    end
    true
  end

  # Derives the order's status from its lines. An order is only as far along as
  # its least advanced item, so a two-vendor order reads "shipped" only once
  # both vendors have shipped.
  def sync_fulfillment_status!
    # Reload: the caller usually holds its own copy of the item it just moved,
    # so the cached association would still show the pre-transition status.
    live = order_items.reload.reject(&:fulfillment_cancelled?)
    return if live.empty?

    derived =
      if live.all?(&:fulfillment_delivered?) then :delivered
      elsif live.all? { |i| i.fulfillment_shipped? || i.fulfillment_delivered? } then :shipped
      elsif live.any? { |i| !i.fulfillment_awaiting? } then :processing
      else :paid
      end

    return if status == derived.to_s

    attrs = { status: derived }
    attrs[:shipped_at] = Time.current if derived == :shipped && shipped_at.nil?
    attrs[:delivered_at] = Time.current if derived == :delivered && delivered_at.nil?
    update!(attrs)
    record_event!(derived.to_s.capitalize, note: "All items #{derived}")
  end

  def record_event!(label, actor: nil, order_item: nil, note: nil)
    order_events.create!(label: label, actor: actor, order_item: order_item, note: note)
  end

  # Stock is taken at order creation so two buyers cannot claim the last unit
  # while one of them is paying. Anything that ends the order without a sale has
  # to give it back — guarded by a flag so it can only ever happen once.
  def release_stock!
    return false if stock_released?

    order_items.includes(:product).each do |item|
      item.product&.increment!(:stock, item.quantity)
    end
    update_column(:stock_released, true)
    true
  end

  private

  def item_event_label(next_status)
    case next_status.to_s
    when "processing" then "Vendor preparing items"
    when "shipped" then "Items shipped"
    when "delivered" then "Items delivered"
    when "cancelled" then "Items cancelled"
    else next_status.to_s.capitalize
    end
  end
end
