class Vendor < ApplicationRecord
  belongs_to :user
  has_many :products, dependent: :destroy
  has_many :order_items, dependent: :restrict_with_error
  has_many :payouts, dependent: :restrict_with_error

  enum :status, { pending: 0, active: 1, suspended: 2 }

  validates :store_name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :commission_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }

  before_validation :generate_slug, on: :create

  private

  def generate_slug
    return if slug.present?
    base = store_name.to_s.parameterize
    candidate = base
    n = 1
    while Vendor.exists?(slug: candidate)
      n += 1
      candidate = "#{base}-#{n}"
    end
    self.slug = candidate
  end
end
