class Inspection < ApplicationRecord
  STATUSES = %w[awaiting_evidence under_review passed failed waived].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :trade_order
  belongs_to :submitted_by, class_name: "User", optional: true
  belongs_to :reviewed_by, class_name: "User", optional: true
  has_many :reports, class_name: "InspectionReport", dependent: :destroy

  validates :status, inclusion: { in: STATUSES }

  def pass!(admin:, notes: nil)
    update!(status: :passed, outcome: "pass", reviewed_by: admin, reviewed_at: Time.current, notes: notes)
    trade_order.record_event!("inspection.passed", actor: admin)
  end

  def fail!(admin:, notes: nil)
    update!(status: :failed, outcome: "fail", reviewed_by: admin, reviewed_at: Time.current, notes: notes)
    trade_order.record_event!("inspection.failed", actor: admin, details: { notes: notes })
  end

  def waive!(admin:, notes: nil)
    update!(status: :waived, outcome: "waived", reviewed_by: admin, reviewed_at: Time.current, notes: notes)
    trade_order.record_event!("inspection.waived", actor: admin)
  end
end
