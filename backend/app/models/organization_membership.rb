class OrganizationMembership < ApplicationRecord
  ROLES = %w[owner buyer finance operations].freeze
  STATUSES = %w[active suspended].freeze

  belongs_to :organization
  belongs_to :user

  validates :role, inclusion: { in: ROLES }
  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: :active) }

  def can_transact?
    %w[owner buyer finance].include?(role) && status == "active"
  end
end
