class TradeOrder < ApplicationRecord
  STATUSES = %w[awaiting_acceptance awaiting_funding funded inspection_pending ready_to_ship shipped delivered release_pending completed disputed refunded cancelled].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :request_for_quote
  belongs_to :quotation
  belongs_to :buyer_organization, class_name: "Organization"
  belongs_to :supplier_organization, class_name: "Organization"
  belongs_to :vendor
  has_many :acceptances, class_name: "TradeOrderAcceptance", dependent: :destroy
  has_many :milestones, class_name: "TradeMilestone", dependent: :destroy
  has_one :protected_payment, dependent: :destroy
  has_many :financial_movements, dependent: :restrict_with_error
  has_many :events, class_name: "TradeEvent", dependent: :destroy
  has_one :inspection, dependent: :destroy
  has_one :shipment, class_name: "TradeShipment", dependent: :destroy
  has_one :delivery_acceptance, dependent: :destroy
  has_many :disputes, class_name: "TradeDispute", dependent: :destroy
  has_one_attached :contract_document

  validates :reference, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :currency, :terms_sha256, presence: true
  validate :organizations_have_correct_kinds, on: :create
  validate :commercial_snapshot_is_immutable, on: :update
  validates :subtotal_cents, :shipping_cents, :total_cents,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  before_validation :generate_reference, on: :create

  scope :reverse_chronologically, -> { order(created_at: :desc) }
  scope :active, -> { where.not(status: %w[completed refunded cancelled]) }

  def self.create_from_quotation!(quotation, buyer_organization:, buyer:)
    rfq = quotation.request_for_quote
    vendor = quotation.vendor
    supplier_organization = vendor.organization || Organization.create!(name: vendor.store_name, kind: :supplier, status: :active)
    vendor.update!(organization: supplier_organization) unless vendor.organization_id
    terms = {
      "reference" => rfq.reference,
      "quotation_id" => quotation.id,
      "currency" => quotation.currency,
      "incoterm" => quotation.incoterm,
      "lead_time_days" => quotation.lead_time_days,
      "destination_port" => rfq.destination_port,
      "specifications" => rfq.specifications,
      "items" => quotation.items.order(:id).map { |item|
        { "description" => item.description, "quantity" => item.quantity,
          "unit_price_cents" => item.unit_price_cents, "line_total_cents" => item.line_total_cents }
      }
    }
    digest = Digest::SHA256.hexdigest(JSON.generate(terms))

    trade_order = create!(
      request_for_quote: rfq,
      quotation: quotation,
      buyer_organization: buyer_organization,
      supplier_organization: supplier_organization,
      vendor: vendor,
      currency: quotation.currency,
      subtotal_cents: quotation.items.sum(:line_total_cents),
      shipping_cents: quotation.shipping_cents,
      total_cents: quotation.total_cents,
      incoterm: quotation.incoterm,
      destination_port: rfq.destination_port,
      specifications: rfq.specifications,
      terms: terms,
      terms_sha256: digest,
      inspection_required: rfq.inspection_required,
      status: :awaiting_acceptance
    )
    trade_order.milestones.create!(sequence: 1, name: "Delivery", amount_cents: trade_order.total_cents,
                                   release_condition: "buyer_acceptance_or_seven_days")
    trade_order.create_inspection!(status: :awaiting_evidence) if trade_order.inspection_required?
    trade_order.record_event!("trade_order.created", actor: buyer)
    Contracts::GeneratePdf.call(trade_order)
    trade_order
  end

  def accept!(user:, organization:, role:, ip_address: nil, user_agent: nil)
    raise ArgumentError, "The terms have changed" unless organization == buyer_organization || organization == supplier_organization
    raise ArgumentError, "The user is not authorized for this organization" unless organization.transact_as?(user)
    raise ArgumentError, "Unknown acceptance role" unless %w[buyer supplier].include?(role.to_s)
    raise ArgumentError, "The wrong organization is accepting" if role.to_s == "buyer" && organization != buyer_organization
    raise ArgumentError, "The wrong organization is accepting" if role.to_s == "supplier" && organization != supplier_organization

    with_lock do
      existing = acceptances.find_by(organization: organization)
      if existing
        raise ArgumentError, "This organization already accepted different terms" unless existing.terms_sha256 == terms_sha256

        return self
      end

      acceptances.create!(organization: organization, user: user, role: role,
                          terms_sha256: terms_sha256, accepted_at: Time.current,
                          ip_address: ip_address, user_agent: user_agent)
      update!(status: :awaiting_funding) if acceptances.count == 2
      record_event!("contract.accepted", actor: user, details: { role: role })
    end
    self
  end

  def fully_accepted?
    acceptances.where(terms_sha256: terms_sha256).distinct.count(:organization_id) == 2
  end

  def funded?
    protected_payment&.funded? || protected_payment&.release_pending? || protected_payment&.partially_released? ||
      protected_payment&.partially_refunded?
  end

  def dispute_open?
    disputes.where(status: %w[open under_review]).exists?
  end

  def inspection_passed?
    inspection.nil? || inspection.passed? || inspection.waived?
  end

  def release_allowed?
    return false unless funded?
    return false if dispute_open? || !inspection_passed?

    delivery_acceptance.present? || (delivered_at.present? && delivered_at <= inspection_window_days.days.ago)
  end

  def mark_delivered!(at: Time.current, actor: nil)
    update!(status: :delivered, delivered_at: at)
    record_event!("delivery.verified", actor: actor)
  end

  def accept_delivery!(user:, organization:)
    raise ArgumentError, "Only the buyer organization can accept delivery" unless organization == buyer_organization
    raise ArgumentError, "The buyer is not authorized for this organization" unless organization.transact_as?(user)
    raise ArgumentError, "Delivery has not been verified" unless delivered?
    raise ArgumentError, "Delivery is already accepted" if delivery_acceptance.present?

    transaction do
      create_delivery_acceptance!(organization: organization, user: user, accepted_at: Time.current)
      update!(status: :release_pending)
      record_event!("delivery.accepted", actor: user)
    end
    self
  end

  def open_dispute!(user:, reason:, detail:, amount_cents: total_cents)
    raise ArgumentError, "The buyer is not authorized for this trade" unless buyer_organization.transact_as?(user)
    raise ArgumentError, "The trade is not funded" unless funded?
    raise ArgumentError, "The disputed amount is invalid" unless amount_cents.positive? && amount_cents <= total_cents

    transaction do
      dispute = disputes.create!(opened_by: user, reason: reason, detail: detail, amount_cents: amount_cents)
      update!(status: :disputed, disputed_at: Time.current)
      record_event!("dispute.opened", actor: user, details: { dispute_id: dispute.id, amount_cents: amount_cents })
      dispute
    end
  end

  def cancel!(user:, organization:)
    raise ArgumentError, "Only the buyer organization can cancel this trade" unless organization == buyer_organization
    raise ArgumentError, "The buyer is not authorized for this organization" unless organization.transact_as?(user)
    return self if cancelled?
    raise ArgumentError, "A completed or resolved trade cannot be cancelled" if completed? || refunded?

    transaction do
      update!(status: :cancelled, cancelled_at: Time.current)
      record_event!("trade_order.cancelled", actor: user)
    end
    self
  end

  def append_movement!(movement_type, amount_cents:, external_reference: nil, metadata: {})
    financial_movements.create!(protected_payment: protected_payment, movement_type: movement_type,
                                amount_cents: amount_cents, currency: currency,
                                external_reference: external_reference || "#{movement_type}-#{SecureRandom.hex(8)}",
                                metadata: metadata, occurred_at: Time.current)
  end

  def record_event!(event_type, actor: nil, details: {})
    events.create!(actor: actor, event_type: event_type, details: details)
  end

  private

  COMMERCIAL_SNAPSHOT_FIELDS = %w[request_for_quote_id quotation_id buyer_organization_id supplier_organization_id
                                  vendor_id reference currency subtotal_cents shipping_cents total_cents incoterm
                                  destination_port specifications terms terms_sha256 inspection_required
                                  inspection_window_days delivery_due_at].freeze

  def commercial_snapshot_is_immutable
    changed = changes.keys & COMMERCIAL_SNAPSHOT_FIELDS
    errors.add(:base, "Accepted commercial terms are immutable") if changed.any?
  end

  def organizations_have_correct_kinds
    errors.add(:buyer_organization, "must be a buyer organization") unless buyer_organization&.buyer?
    errors.add(:supplier_organization, "must be a supplier organization") unless supplier_organization&.supplier?
  end

  def generate_reference
    self.reference ||= "TRD-#{Time.current.strftime('%y%m%d')}-#{SecureRandom.alphanumeric(6).upcase}"
  end
end
