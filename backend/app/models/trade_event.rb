class TradeEvent < ApplicationRecord
  belongs_to :trade_order, optional: true
  belongs_to :request_for_quote, optional: true
  belongs_to :actor, class_name: "User", optional: true

  validates :event_type, presence: true
  validate :append_only, on: :update

  private

  def append_only
    errors.add(:base, "Trade events are append-only")
  end
end
