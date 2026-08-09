class RequestForQuote < ApplicationRecord
  STATUSES = %w[new reviewing quoted open awarded closed cancelled].freeze


  # The delivery terms a commercial buyer works in. Kept to the ones that
  # actually come up for Ethiopian export.
  INCOTERMS = %w[ EXW FOB CIF CFR DAP ].freeze

  belongs_to :product, optional: true
  belongs_to :buyer, class_name: "User", optional: true
  belongs_to :organization, optional: true
  has_many :items, class_name: "RequestForQuoteItem", dependent: :destroy
  has_many :supplier_invitations, dependent: :destroy
  has_many :quotations, dependent: :destroy
  has_many :trade_orders, dependent: :restrict_with_error

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
  scope :business_requests, -> { where.not(organization_id: nil) }

  def business_request?
    organization_id.present?
  end

  def publish!(actor: nil)
    transaction do
      update!(status: "open")
      record_trade_event!("rfq.published", actor: actor)
    end
    self
  end

  def invite_suppliers!
    RequestForQuote::Matching.new(self).invite!
  end

  def record_trade_event!(event_type, actor: nil, details: {})
    TradeEvent.create!(request_for_quote: self, actor: actor, event_type: event_type, details: details)
  end

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
