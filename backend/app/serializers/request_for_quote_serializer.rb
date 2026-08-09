class RequestForQuoteSerializer
  def self.render(request_for_quote)
    {
      id: request_for_quote.id,
      reference: request_for_quote.reference,
      companyName: request_for_quote.company_name,
      contactName: request_for_quote.contact_name,
      email: request_for_quote.email,
      country: request_for_quote.country,
      productInterest: request_for_quote.product_interest,
      productId: request_for_quote.product_id,
      productName: request_for_quote.product&.name,
      productSlug: request_for_quote.product&.slug,
      estimatedQuantity: request_for_quote.estimated_quantity,
      specifications: request_for_quote.specifications,
      incoterm: request_for_quote.incoterm,
      destinationPort: request_for_quote.destination_port,
      targetPriceCents: request_for_quote.target_price_cents,
      sampleRequested: request_for_quote.sample_requested,
      inspectionRequired: request_for_quote.inspection_required,
      quotedUnitPriceCents: request_for_quote.quoted_unit_price_cents,
      quotedLeadTimeDays: request_for_quote.quoted_lead_time_days,
      quoteNote: request_for_quote.quote_note,
      quotedAt: request_for_quote.quoted_at,
      status: request_for_quote.status,
      createdAt: request_for_quote.created_at.iso8601
    }
  end
end
