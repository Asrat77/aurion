class Organization < ApplicationRecord
  KINDS = %w[buyer supplier].freeze
  STATUSES = %w[pending active suspended].freeze
  VERIFICATION_STATUSES = %w[unverified pending verified rejected].freeze

  has_many :memberships, class_name: "OrganizationMembership", dependent: :destroy
  has_many :users, through: :memberships
  has_many :vendors, dependent: :nullify
  has_many :request_for_quotes, dependent: :restrict_with_error
  has_many :buyer_trade_orders, class_name: "TradeOrder", foreign_key: :buyer_organization_id,
           dependent: :restrict_with_error
  has_many :supplier_trade_orders, class_name: "TradeOrder", foreign_key: :supplier_organization_id,
           dependent: :restrict_with_error
  has_many :provider_accounts, dependent: :destroy
  has_many :notifications, dependent: :destroy
  belongs_to :verified_by, class_name: "User", optional: true

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }
  validates :status, inclusion: { in: STATUSES }
  validates :verification_status, inclusion: { in: VERIFICATION_STATUSES }

  scope :active, -> { where(status: :active) }
  scope :verified, -> { where(verification_status: :verified) }

  def active?
    status == "active"
  end

  def buyer?
    kind == "buyer"
  end

  def supplier?
    kind == "supplier"
  end

  def verified?
    verification_status == "verified" && status == "active"
  end

  def member?(user)
    memberships.active.exists?(user: user)
  end

  def transact_as?(user)
    memberships.active.where(user: user, role: %w[owner buyer finance]).exists?
  end

  def administer_as?(user)
    memberships.active.where(user: user, role: %w[owner finance operations]).exists?
  end

  def verify!(admin:)
    update!(status: :active, verification_status: :verified, verified_at: Time.current, verified_by: admin)
  end
end
