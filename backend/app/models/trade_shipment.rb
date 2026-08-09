class TradeShipment < ApplicationRecord
  STATUSES = %w[awaiting_shipment shipped delivered verified].freeze

  enum :status, STATUSES.index_with(&:to_s)

  belongs_to :trade_order
  belongs_to :verified_by, class_name: "User", optional: true
  has_many_attached :documents

  validates :status, inclusion: { in: STATUSES }

  def ship!(carrier:, tracking_number:)
    raise ArgumentError, "Carrier and tracking number are required" if carrier.blank? || tracking_number.blank?
    raise ArgumentError, "The shipment has already been recorded" unless awaiting_shipment?

    update!(status: :shipped, carrier: carrier, tracking_number: tracking_number, shipped_at: Time.current)
    trade_order.update!(status: :shipped)
    trade_order.record_event!("shipment.shipped", details: { carrier: carrier, tracking_number: tracking_number })
  end

  def verify_delivery!(admin:)
    raise ArgumentError, "The shipment must be shipped before delivery can be verified" unless shipped? || delivered?

    update!(status: :verified, delivered_at: delivered_at || Time.current,
            delivery_verified_at: Time.current, verified_by: admin)
    trade_order.mark_delivered!(at: delivered_at, actor: admin)
  end
end
