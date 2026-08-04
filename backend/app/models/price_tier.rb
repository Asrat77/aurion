# A volume break on a product: order at least `min_quantity` and each unit costs
# `unit_price_cents`.
class PriceTier < ApplicationRecord
  belongs_to :product

  validates :min_quantity, numericality: { only_integer: true, greater_than: 0 }
  validates :unit_price_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :min_quantity, uniqueness: { scope: :product_id }

  scope :by_quantity, -> { order(:min_quantity) }
end
