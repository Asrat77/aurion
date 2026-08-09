class ProtectedPayment < ApplicationRecord
  STATUSES = %w[created funding_pending funded release_pending released refund_pending partially_released partially_refunded settled refunded cancelled failed].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :trade_order
  has_many :financial_movements, dependent: :nullify

  validates :provider, :currency, presence: true
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }

  def fund!(external_id: nil, occurred_at: Time.current)
    with_lock do
      return self if funded? || released? || refunded?

      update!(status: :funded, external_id: external_id || self.external_id, funded_at: occurred_at,
              last_synced_at: occurred_at)
      trade_order.update!(status: :funded, funded_at: occurred_at)
      trade_order.milestones.where(status: :pending).update_all(status: :funded, funded_at: occurred_at,
                                                                 updated_at: occurred_at)
      trade_order.record_event!("payment.funded", details: { provider: provider, external_id: external_id })
      trade_order.append_movement!("funded", amount_cents: amount_cents, external_reference: external_id)
    end
    self
  end

  def request_release!(occurred_at: Time.current)
    with_lock do
      return false unless funded? || partially_released? || partially_refunded?
      return false unless trade_order.release_allowed?

      update!(status: :release_pending, release_requested_at: occurred_at)
      trade_order.update!(status: :release_pending)
      trade_order.record_event!("payment.release_requested")
      true
    end
  end

  def release!(amount_cents: nil, external_reference: nil, occurred_at: Time.current)
    with_lock do
      return self if released? || settled? && releasable_cents.zero?
      amount_cents = releasable_cents if amount_cents.blank?
      return self if amount_cents.to_i.zero?
      amount_cents = amount_cents.to_i
      raise ArgumentError, "Release amount must be positive" unless amount_cents.positive?
      raise ArgumentError, "Release exceeds the protected amount" if amount_cents > releasable_cents
      raise ArgumentError, "Payment is not ready for release" unless release_pending? || trade_order.release_allowed? || trade_order.disputed?

      next_released_cents = released_cents + amount_cents
      new_status = settled_after?(released: next_released_cents, refunded: refunded_cents) ? :settled : :partially_released
      update!(status: new_status, released_at: occurred_at, last_synced_at: occurred_at)
      milestone = trade_order.milestones.find_by(sequence: 1)
      milestone&.update!(status: new_status == :settled ? :released : :release_pending,
                         released_at: new_status == :settled ? occurred_at : nil)
      trade_order.update!(status: :completed, completed_at: occurred_at) if new_status == :settled
      trade_order.record_event!("payment.released", details: { amount_cents: amount_cents, external_reference: external_reference })
      trade_order.append_movement!("released", amount_cents: amount_cents, external_reference: external_reference)
    end
    self
  end

  def refund!(amount_cents:, external_reference: nil, occurred_at: Time.current)
    with_lock do
      amount_cents = amount_cents.to_i
      raise ArgumentError, "Refund amount must be positive" unless amount_cents.positive?
      raise ArgumentError, "Refund exceeds the protected amount" if amount_cents > refundable_cents
      raise ArgumentError, "Payment is not funded" unless funded? || release_pending? || partially_released? || partially_refunded?

      next_refunded_cents = refunded_cents + amount_cents
      new_status = settled_after?(released: released_cents, refunded: next_refunded_cents) ? :settled : :partially_refunded
      update!(status: new_status, refunded_at: occurred_at, last_synced_at: occurred_at)
      milestone = trade_order.milestones.find_by(sequence: 1)
      milestone&.update!(status: :refunded) if new_status == :settled && released_cents.zero?
      milestone&.update!(status: :released, released_at: occurred_at) if new_status == :settled && released_cents.positive?
      trade_order.update!(status: :refunded, refunded_at: occurred_at) if new_status == :settled && released_cents.zero?
      trade_order.update!(status: :completed, completed_at: occurred_at) if new_status == :settled && released_cents.positive?
      trade_order.record_event!("payment.refunded", details: { amount_cents: amount_cents })
      trade_order.append_movement!("refunded", amount_cents: amount_cents, external_reference: external_reference)
    end
    self
  end

  def refunded_cents
    financial_movements.where(movement_type: "refunded").sum(:amount_cents)
  end

  def released_cents
    financial_movements.where(movement_type: "released").sum(:amount_cents)
  end

  def settled_cents
    refunded_cents + released_cents
  end

  def refundable_cents
    amount_cents - refunded_cents - released_cents
  end

  def releasable_cents
    amount_cents - refunded_cents - released_cents
  end

  def settled?
    settled_cents >= amount_cents
  end

  private

  def settled_after?(released:, refunded:)
    released.to_i + refunded.to_i >= amount_cents
  end
end
