class RequestForQuote < ApplicationRecord
  STATUSES = %w[ new reviewing quoted closed ].freeze

  # The delivery terms a commercial buyer works in. Kept to the ones that
  # actually come up for Ethiopian export.
  INCOTERMS = %w[ EXW FOB CIF CFR DAP ].freeze

  belongs_to :product, optional: true

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :company_name, :contact_name, :country, :product_interest, :estimated_quantity,
    with: ->(value) { value.strip }

  validates :reference, presence: true, uniqueness: true
  validates :company_name, :email, :product_interest, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: STATUSES }
  validates :incoterm, inclusion: { in: INCOTERMS }, allow_blank: true
  validates :target_price_cents, :quoted_unit_price_cents,
            numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :quoted_lead_time_days,
            numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  before_validation :generate_reference, on: :create

  scope :reverse_chronologically, -> { order(created_at: :desc) }
  scope :open_requests, -> { where(status: %w[new reviewing]) }

  # Recording a quote is what moves a request from "we are looking at it" to
  # "here is our price".
  def quote!(unit_price_cents:, lead_time_days: nil, note: nil)
    update(
      status: "quoted",
      quoted_unit_price_cents: unit_price_cents,
      quoted_lead_time_days: lead_time_days,
      quote_note: note,
      quoted_at: Time.current
    )
  end

  private
    def generate_reference
      self.reference ||= "RFQ-#{Time.current.strftime('%y%m%d')}-#{SecureRandom.alphanumeric(6).upcase}"
    end
end
