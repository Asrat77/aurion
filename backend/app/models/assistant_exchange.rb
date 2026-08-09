class AssistantExchange < ApplicationRecord
  STATUSES = %w[pending answered failed refused].freeze

  belongs_to :user, optional: true

  validates :conversation_key, :channel, :task, :provider, :model, :question, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :recent, -> { order(created_at: :desc) }
  scope :answered, -> { where(status: "answered") }
end
