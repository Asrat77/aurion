class DisputeEvidence < ApplicationRecord
  belongs_to :trade_dispute
  belongs_to :submitted_by, class_name: "User"
  has_many_attached :evidence_files

  validates :body, presence: true
  validate :immutable_after_create, on: :update

  private

  def immutable_after_create
    errors.add(:base, "Dispute evidence is immutable")
  end
end
