class TradeDispute < ApplicationRecord
  STATUSES = %w[open under_review resolved rejected].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :trade_order
  belongs_to :opened_by, class_name: "User"
  belongs_to :resolved_by, class_name: "User", optional: true
  has_many :evidence, class_name: "DisputeEvidence", dependent: :destroy
  has_one :resolution, class_name: "DisputeResolution", dependent: :destroy

  validates :reason, :detail, presence: true
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }

  def resolve!(admin:, refund_cents:, release_cents:, note: nil)
    raise ArgumentError, "A resolution must allocate a positive amount" unless refund_cents.positive? || release_cents.positive?
    with_lock do
      raise ArgumentError, "Resolution exceeds the disputed amount" if refund_cents + release_cents > amount_cents
      raise ArgumentError, "This dispute is already resolved" unless open? || under_review?
      payment = trade_order.protected_payment
      raise ArgumentError, "Resolution exceeds the amount still held" unless payment && refund_cents + release_cents <= payment.releasable_cents

      create_resolution!(resolved_by: admin, action: refund_cents.positive? && release_cents.positive? ? "split" : refund_cents.positive? ? "refund" : "release",
                         refund_cents: refund_cents, release_cents: release_cents, note: note)
      update!(status: :resolved, resolved_by: admin, resolved_at: Time.current, resolution_note: note)
      trade_order.record_event!("dispute.resolved", actor: admin,
                                details: { refund_cents: refund_cents, release_cents: release_cents })
    end
    self
  end
end
