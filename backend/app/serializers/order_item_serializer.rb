class OrderItemSerializer
  def self.render(item)
    {
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      emoji: item.product&.emoji,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
      commissionCents: item.commission_cents,
      netCents: item.net_cents,
      vendorName: item.vendor.store_name,
    }
  end
end
