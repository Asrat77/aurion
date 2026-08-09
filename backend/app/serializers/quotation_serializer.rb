class QuotationSerializer
  def self.render(quotation, include_items: true)
    body = {
      id: quotation.id,
      requestForQuoteId: quotation.request_for_quote_id,
      vendorId: quotation.vendor_id,
      vendorName: quotation.vendor.store_name,
      revision: quotation.revision,
      status: quotation.status,
      currency: quotation.currency,
      incoterm: quotation.incoterm,
      leadTimeDays: quotation.lead_time_days,
      shippingCents: quotation.shipping_cents,
      totalCents: quotation.total_cents,
      validUntil: quotation.valid_until&.iso8601,
      note: quotation.note,
      submittedAt: quotation.submitted_at&.iso8601,
      acceptedAt: quotation.accepted_at&.iso8601
    }
    body[:items] = quotation.items.includes(:product).map do |item|
      { id: item.id, productId: item.product_id, description: item.description,
        quantity: item.quantity, unitPriceCents: item.unit_price_cents,
        lineTotalCents: item.line_total_cents, currency: item.currency }
    end if include_items
    body
  end
end
