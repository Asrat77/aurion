class VendorOrderItemSerializer
  def self.render(item)
    {
      id: item.id,
      orderReference: item.order.reference,
      productName: item.product_name,
      emoji: item.product&.emoji,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
      netCents: item.net_cents,
      fulfillmentStatus: item.fulfillment_status,
      nextStatuses: OrderItem::FORWARD_TRANSITIONS.fetch(item.fulfillment_status, []),
      carrier: item.carrier,
      trackingNumber: item.tracking_number,
      shippedAt: item.shipped_at,
      deliveredAt: item.delivered_at,
      buyerEmail: item.order.buyer.email,
      createdAt: item.order.created_at
    }
  end
end
