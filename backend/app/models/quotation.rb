class Quotation < ApplicationRecord
  STATUSES = %w[draft submitted withdrawn accepted rejected expired].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :request_for_quote
  belongs_to :vendor
  belongs_to :supersedes, class_name: "Quotation", optional: true
  has_many :revisions, class_name: "Quotation", foreign_key: :supersedes_id, dependent: :nullify
  has_many :items, class_name: "QuotationItem", dependent: :destroy
  has_one :trade_order, dependent: :restrict_with_error

  validates :revision, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validates :currency, presence: true
  validates :total_cents, numericality: { only_integer: true, greater_than: 0 }, if: :submitted?
  validate :submitted_quotes_are_immutable, on: :update

  scope :submitted, -> { where(status: :submitted) }
  scope :latest_first, -> { order(revision: :desc) }

  def editable?
    draft?
  end

  def submit!
    raise ActiveRecord::RecordInvalid, self unless draft? && items.exists?

    transaction do
      update!(status: :submitted, submitted_at: Time.current, total_cents: items.sum(:line_total_cents) + shipping_cents)
      request_for_quote.supplier_invitations.where(vendor: vendor).first&.mark_quoted!
      request_for_quote.update!(status: "reviewing") if request_for_quote.status == "new"
    end
    self
  end

  def withdraw!
    update!(status: :withdrawn, withdrawn_at: Time.current) if submitted?
    self
  end

  def accept!(buyer:, organization:, ip_address: nil, user_agent: nil)
    raise ActiveRecord::RecordInvalid, self unless submitted?
    raise ArgumentError, "The buyer organization is not verified" unless organization.verified?
    raise ArgumentError, "The buyer is not authorized for this organization" unless organization.transact_as?(buyer)

    request_for_quote.with_lock do
      raise ActiveRecord::RecordInvalid, self if request_for_quote.quotations.where(status: :accepted).where.not(id: id).exists?

      transaction do
        update!(status: :accepted, accepted_at: Time.current)
        request_for_quote.update!(status: "awarded")
        trade_order = TradeOrder.create_from_quotation!(self, buyer_organization: organization, buyer: buyer)
        trade_order.accept!(user: buyer, organization: organization, role: :buyer,
                            ip_address: ip_address, user_agent: user_agent)
      end
    end
    trade_order.reload
  end

  private

  def submitted_quotes_are_immutable
    return unless persisted? && status_in_database == "submitted"

    changed_attributes = changes.keys - %w[status accepted_at withdrawn_at updated_at]
    errors.add(:base, "Submitted quotations cannot be changed") if changed_attributes.any?
  end
end
