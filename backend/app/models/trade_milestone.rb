class TradeMilestone < ApplicationRecord
  STATUSES = %w[pending funded release_pending released refunded].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :trade_order

  validates :sequence, numericality: { only_integer: true, greater_than: 0 }
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
end
