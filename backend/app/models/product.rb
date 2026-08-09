class Product < ApplicationRecord
  belongs_to :vendor
  belongs_to :category
  has_many :order_items, dependent: :restrict_with_error
  has_many :reviews, dependent: :destroy
  has_many :price_tiers, dependent: :destroy

  enum :status, { draft: 0, active: 1 }

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :price_cents, numericality: { greater_than: 0 }
  validates :stock, numericality: { greater_than_or_equal_to: 0 }

  before_validation :generate_slug, on: :create

  scope :in_stock, -> { where("stock > 0") }
  # Available at commercial scale. A product with no MOQ is retail-only.
  scope :wholesale, -> { where.not(moq: nil) }
  scope :for_express, -> { where(express_enabled: true) }
  scope :for_business, -> { where(business_enabled: true).where.not(moq: nil) }

  def price_dollars
    price_cents / 100.0
  end

  def wholesale?
    moq.present?
  end

  # The unit price for a given order size: the best volume break the quantity
  # qualifies for, falling back to the retail price.
  def unit_price_for(quantity)
    tier = price_tiers.by_quantity.select { |t| quantity >= t.min_quantity }.last
    tier&.unit_price_cents || price_cents
  end

  private

  def generate_slug
    return if slug.present?
    base = name.to_s.parameterize
    candidate = base
    n = 1
    while Product.exists?(slug: candidate)
      n += 1
      candidate = "#{base}-#{n}"
    end
    self.slug = candidate
  end
end
