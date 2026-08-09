class DeliveryAcceptance < ApplicationRecord
  belongs_to :trade_order
  belongs_to :organization
  belongs_to :user

  validates :accepted_at, presence: true
end
