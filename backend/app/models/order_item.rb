class OrderItem < ApplicationRecord
  # Each vendor moves their own line along; the order's overall status is
  # derived from these by Order#sync_fulfillment_status!.
  FULFILLMENT_STATUSES = {
    awaiting: 0,
    processing: 1,
    shipped: 2,
    delivered: 3,
    cancelled: 4
  }.freeze

  FORWARD_TRANSITIONS = {
    "awaiting" => %w[processing cancelled],
    "processing" => %w[shipped cancelled],
    "shipped" => %w[delivered],
    "delivered" => [],
    "cancelled" => []
  }.freeze

  belongs_to :order
  belongs_to :product
  belongs_to :vendor
  has_one :payout, dependent: :restrict_with_error
  has_one :review, dependent: :destroy
  has_many :refund_requests, dependent: :destroy

  enum :fulfillment_status, FULFILLMENT_STATUSES, prefix: :fulfillment

  def can_advance_to?(next_status)
    FORWARD_TRANSITIONS.fetch(fulfillment_status, []).include?(next_status.to_s)
  end

  def advance_to!(next_status, carrier: nil, tracking_number: nil)
    next_status = next_status.to_s
    attrs = { fulfillment_status: next_status }

    case next_status
    when "shipped"
      attrs[:shipped_at] = Time.current
      attrs[:carrier] = carrier if carrier.present?
      attrs[:tracking_number] = tracking_number if tracking_number.present?
    when "delivered"
      attrs[:delivered_at] = Time.current
    end

    update!(attrs)
  end
end
