class InspectionReport < ApplicationRecord
  belongs_to :inspection
  belongs_to :submitted_by, class_name: "User"
  has_many_attached :evidence_files

  validates :version, numericality: { only_integer: true, greater_than: 0 }
  validates :body, :sha256, presence: true

  before_validation :digest_body, on: :create
  validate :immutable_after_create, on: :update

  private

  def immutable_after_create
    errors.add(:base, "Inspection reports are immutable")
  end

  def digest_body
    self.sha256 ||= Digest::SHA256.hexdigest(body.to_s)
  end
end
