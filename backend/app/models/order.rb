class Order < ApplicationRecord
  belongs_to :buyer, class_name: "User"
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0, paid: 1, fulfilled: 2, cancelled: 3 }

  validates :subtotal_cents, :shipping_cents, :tax_cents, :total_cents,
            numericality: { greater_than_or_equal_to: 0 }

  def reference
    "AUR-#{id.to_s.rjust(6, '0')}"
  end

  # Idempotent: only transitions pending -> paid, and only ever creates one
  # payout per order_item (guarded by the unique index on order_item_id).
  def mark_paid!(payment_method: nil, payment_ref: nil)
    return true if paid? || fulfilled?
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
    end
    true
  end
end
