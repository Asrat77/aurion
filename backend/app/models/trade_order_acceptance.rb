class TradeOrderAcceptance < ApplicationRecord
  belongs_to :trade_order
  belongs_to :organization
  belongs_to :user

  validates :role, inclusion: { in: %w[buyer supplier] }
  validates :terms_sha256, presence: true
  validates :accepted_at, presence: true
  validate :immutable_after_create, on: :update

  private

  def immutable_after_create
    errors.add(:base, "Contract acceptances are immutable")
  end
end
