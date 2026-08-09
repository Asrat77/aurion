class FinancialMovement < ApplicationRecord
  MOVEMENT_TYPES = %w[funded release_requested released refund_requested refunded reversed chargeback].freeze

  belongs_to :trade_order
  belongs_to :protected_payment, optional: true

  validates :movement_type, inclusion: { in: MOVEMENT_TYPES }
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :currency, :occurred_at, presence: true
  validate :append_only, on: :update

  private

  def append_only
    errors.add(:base, "Financial movements are append-only")
  end
end
