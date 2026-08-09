class ProviderEvent < ApplicationRecord
  STATUSES = %w[received processing processed failed].freeze

  validates :provider, :external_event_id, :event_type, :payload_checksum, presence: true
  validates :external_event_id, uniqueness: { scope: :provider }
  validates :status, inclusion: { in: STATUSES }

  def processed?
    status == "processed"
  end
end
