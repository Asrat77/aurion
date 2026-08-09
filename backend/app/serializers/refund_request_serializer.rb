class RefundRequestSerializer
  def self.render(claim, include_buyer: false)
    hash = {
      id: claim.id,
      orderId: claim.order_id,
      orderReference: claim.order.reference,
      orderItemId: claim.order_item_id,
      productName: claim.order_item.product_name,
      vendorName: claim.order_item.vendor.store_name,
      reason: claim.reason,
      reasonLabel: claim.reason.to_s.humanize,
      detail: claim.detail,
      status: claim.status,
      amountCents: claim.amount_cents,
      currency: claim.order.currency,
      fxRate: claim.order.fx_rate.to_f,
      resolutionNote: claim.resolution_note,
      resolvedAt: claim.resolved_at,
      createdAt: claim.created_at.iso8601
    }
    hash[:buyerEmail] = claim.buyer.email if include_buyer
    hash
  end
end
