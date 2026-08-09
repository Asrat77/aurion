class IdempotencyRecord < ApplicationRecord
  validates :scope_key, :key, :request_hash, presence: true
  validates :key, uniqueness: { scope: :scope_key }

  def same_request?(hash)
    request_hash == hash
  end
end
