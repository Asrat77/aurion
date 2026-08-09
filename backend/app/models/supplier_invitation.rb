class SupplierInvitation < ApplicationRecord
  STATUSES = %w[invited viewed declined quoted awarded].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :request_for_quote
  belongs_to :vendor

  validates :score, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: STATUSES }

  scope :recently_invited, -> { order(invited_at: :desc) }

  def mark_viewed!
    update!(status: :viewed) if invited?
  end

  def mark_quoted!
    update!(status: :quoted, responded_at: Time.current)
  end
end
