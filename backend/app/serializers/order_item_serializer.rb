class OrderItemSerializer
  def self.render(item)
    {
      id: item.id,
      productId: item.product_id,
      productSlug: item.product&.slug,
      productName: item.product_name,
      emoji: item.product&.emoji,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
      commissionCents: item.commission_cents,
      netCents: item.net_cents,
      fulfillmentStatus: item.fulfillment_status,
      refundStatus: item.refund_requests.max_by(&:created_at)&.status,
      refundable: RefundRequest.claimable?(item),
      reviewable: item.fulfillment_delivered? && item.review.nil?,
      reviewed: item.review.present?,
      carrier: item.carrier,
      trackingNumber: item.tracking_number,
      shippedAt: item.shipped_at,
      deliveredAt: item.delivered_at,
      vendorId: item.vendor_id,
      vendorName: item.vendor.store_name,
    }
  end
end
