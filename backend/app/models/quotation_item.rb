class QuotationItem < ApplicationRecord
  belongs_to :quotation
  belongs_to :product, optional: true

  validates :description, presence: true
  validates :quantity, :unit_price_cents, :line_total_cents,
            numericality: { only_integer: true, greater_than: 0 }

  before_validation :calculate_line_total, if: -> { quantity.present? && unit_price_cents.present? }

  private

  def calculate_line_total
    self.line_total_cents = quantity * unit_price_cents
  end
end
