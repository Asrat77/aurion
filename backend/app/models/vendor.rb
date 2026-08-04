class Vendor < ApplicationRecord
  # A vendor record starts life as an application. It only becomes a real store
  # — and its owner only gains the vendor role — once an admin approves it.
  enum :status, { pending: 0, active: 1, suspended: 2, rejected: 3 }

  belongs_to :user
  belongs_to :reviewed_by, class_name: "User", optional: true
  has_many :products, dependent: :destroy
  has_many :order_items, dependent: :restrict_with_error
  has_many :payouts, dependent: :restrict_with_error
  has_many :conversations, dependent: :destroy

  validates :store_name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :commission_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }
  # Required of anyone applying to sell. Vendors created directly — by seeds or
  # by an admin — are not applications and are not held to it.
  validates :contact_name, :contact_phone, :country, presence: true, if: :application?

  before_validation :generate_slug, on: :create

  scope :applications, -> { where.not(applied_at: nil) }
  scope :awaiting_review, -> { applications.where(status: :pending).order(:applied_at) }

  def application?
    applied_at.present?
  end

  # Approving flips the owner's role too, which is what actually unlocks the
  # vendor dashboard — the role check and the vendor record must not disagree.
  def approve!(admin:, note: nil)
    return false unless pending?

    transaction do
      update!(status: :active, reviewed_by: admin, reviewed_at: Time.current, review_note: note)
      user.update!(role: :vendor) unless user.admin?
    end
    true
  end

  def reject!(admin:, note: nil)
    return false unless pending?

    update!(status: :rejected, reviewed_by: admin, reviewed_at: Time.current, review_note: note)
  end

  private

  def generate_slug
    return if slug.present?
    base = store_name.to_s.parameterize
    candidate = base
    n = 1
    while Vendor.exists?(slug: candidate)
      n += 1
      candidate = "#{base}-#{n}"
    end
    self.slug = candidate
  end
end
