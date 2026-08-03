class RequestForQuote < ApplicationRecord
  STATUSES = %w[ new reviewing quoted closed ].freeze

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :company_name, :contact_name, :country, :product_interest, :estimated_quantity,
    with: ->(value) { value.strip }

  validates :reference, presence: true, uniqueness: true
  validates :company_name, :email, :product_interest, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: STATUSES }

  before_validation :generate_reference, on: :create

  scope :reverse_chronologically, -> { order(created_at: :desc) }

  private
    def generate_reference
      self.reference ||= "RFQ-#{Time.current.strftime('%y%m%d')}-#{SecureRandom.alphanumeric(6).upcase}"
    end
end
