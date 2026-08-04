class OrderSerializer
  def self.render(order, include_buyer: false)
    hash = {
      id: order.id,
      reference: order.reference,
      status: order.status,
      subtotalCents: order.subtotal_cents,
      shippingCents: order.shipping_cents,
      taxCents: order.tax_cents,
      totalCents: order.total_cents,
      currency: order.currency,
      fxRate: order.fx_rate.to_f,
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      paidAt: order.paid_at,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at,
      cancelledAt: order.cancelled_at,
      cancellable: order.cancellable?,
      createdAt: order.created_at,
      items: order.order_items.map { |i| OrderItemSerializer.render(i) },
      events: order.order_events.chronologically.map { |e| OrderEventSerializer.render(e) },
    }
    hash[:buyerEmail] = order.buyer.email if include_buyer
    hash
  end
end
