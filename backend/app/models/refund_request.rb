# AURION's buyer protection: a buyer who did not get what they paid for can
# raise a claim against a single line, and an admin decides it. Approving one
# reverses the vendor's payout for that line, so the platform never pays out on
# goods the buyer got refunded for.
class RefundRequest < ApplicationRecord
  REASONS = {
    not_received: 0,
    damaged: 1,
    not_as_described: 2,
    wrong_item: 3,
    other: 4
  }.freeze

  STATUSES = { open: 0, approved: 1, rejected: 2 }.freeze

  # How long after delivery a buyer can still raise a claim.
  CLAIM_WINDOW = 30.days

  belongs_to :order
  belongs_to :order_item
  belongs_to :buyer, class_name: "User"
  belongs_to :resolved_by, class_name: "User", optional: true

  enum :reason, REASONS
  enum :status, STATUSES

  validates :amount_cents, numericality: { greater_than: 0 }
  validates :detail, length: { maximum: 2000 }
  validate :no_other_open_claim, on: :create
  validate :line_is_claimable, on: :create

  scope :recent_first, -> { order(created_at: :desc) }

  def self.claimable?(order_item)
    return false unless order_item.order.settled?
    return false if order_item.fulfillment_cancelled?
    return false if order_item.refund_requests.where(status: [ :open, :approved ]).exists?

    # Undelivered goods can be claimed at any time — that is the "never arrived"
    # case. Delivered ones are claimable only inside the window.
    return true unless order_item.fulfillment_delivered?

    order_item.delivered_at.nil? || order_item.delivered_at > CLAIM_WINDOW.ago
  end

  def approve!(admin:, note: nil)
    return false unless open?

    transaction do
      update!(status: :approved, resolved_by: admin, resolved_at: Time.current,
              resolution_note: note)
      # Reverse the vendor's earnings on this line, then restock it: an approved
      # refund means the sale did not stand.
      order_item.payout&.destroy
      order_item.update!(fulfillment_status: :cancelled)
      order_item.product&.increment!(:stock, order_item.quantity)
      order.record_event!("Refund approved", actor: admin, order_item: order_item,
                                             note: note.presence || "Buyer protection claim upheld")
      settle_order_status!
    end
    true
  end

  def reject!(admin:, note: nil)
    return false unless open?

    update!(status: :rejected, resolved_by: admin, resolved_at: Time.current,
            resolution_note: note)
    order.record_event!("Refund declined", actor: admin, order_item: order_item, note: note)
    true
  end

  private

  # An order whose every line has been refunded is itself refunded; otherwise
  # the remaining lines carry on down the timeline.
  def settle_order_status!
    if order.order_items.reload.all?(&:fulfillment_cancelled?)
      order.update!(status: :refunded)
      order.record_event!("Refunded", note: "All items refunded")
    else
      order.sync_fulfillment_status!
    end
  end

  def no_other_open_claim
    return if order_item.nil?
    return unless order_item.refund_requests.where(status: [ :open, :approved ]).exists?

    errors.add(:base, "There is already an open or approved refund for this item.")
  end

  def line_is_claimable
    return if order_item.nil?
    return if self.class.claimable?(order_item)

    errors.add(:base, "This item is no longer eligible for a refund request.")
  end
end
