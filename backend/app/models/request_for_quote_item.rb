class RequestForQuoteItem < ApplicationRecord
  belongs_to :request_for_quote
  belongs_to :product, optional: true

  validates :description, presence: true
  validates :quantity, numericality: { only_integer: true, greater_than: 0 }
end
