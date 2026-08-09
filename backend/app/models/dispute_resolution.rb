class DisputeResolution < ApplicationRecord
  belongs_to :trade_dispute
  belongs_to :resolved_by, class_name: "User"

  validates :action, inclusion: { in: %w[refund release split] }
  validates :refund_cents, :release_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :immutable_after_create, on: :update

  private

  def immutable_after_create
    errors.add(:base, "Dispute resolutions are immutable")
  end
end
