class Product < ApplicationRecord
  belongs_to :vendor
  belongs_to :category
  has_many :order_items, dependent: :restrict_with_error
  has_many :reviews, dependent: :destroy

  enum :status, { draft: 0, active: 1 }

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :price_cents, numericality: { greater_than: 0 }
  validates :stock, numericality: { greater_than_or_equal_to: 0 }

  before_validation :generate_slug, on: :create

  scope :in_stock, -> { where("stock > 0") }

  def price_dollars
    price_cents / 100.0
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
