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
      estimatedQuantity: request_for_quote.estimated_quantity,
      specifications: request_for_quote.specifications,
      status: request_for_quote.status,
      createdAt: request_for_quote.created_at.iso8601
    }
  end
end
