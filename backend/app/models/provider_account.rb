class ProviderAccount < ApplicationRecord
  belongs_to :organization

  validates :provider, :external_account_id, presence: true
  validates :external_account_id, uniqueness: { scope: :provider }

  def ready_for_payout?
    verification_status == "verified" && payout_capability
  end
end
