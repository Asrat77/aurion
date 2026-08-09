class RequestForQuote::Matching
  Candidate = Data.define(:vendor, :score, :reasons, :last_invited_at)

  def initialize(request_for_quote)
    @request_for_quote = request_for_quote
  end

  def invite!
    candidates = eligible_candidates.sort_by { |candidate| [ -candidate.score, candidate.last_invited_at || Time.at(0), candidate.vendor.id ] }.first(5)

    RequestForQuote.transaction do
      @request_for_quote.update!(status: "open") unless @request_for_quote.status == "open"
      candidates.each do |candidate|
        invitation = @request_for_quote.supplier_invitations.find_or_initialize_by(vendor: candidate.vendor)
        next if invitation.persisted?

        invitation.assign_attributes(score: candidate.score, reasons: candidate.reasons,
                                     status: :invited, invited_at: Time.current)
        invitation.save!
        Notification.create!(user: candidate.vendor.user, organization: candidate.vendor.organization,
                             kind: "supplier_invitation", title: "New sourcing opportunity",
                             body: "You have been invited to quote on #{@request_for_quote.reference}.",
                             data: { requestForQuoteId: @request_for_quote.id })
      end
      @request_for_quote.record_trade_event!("rfq.suppliers_invited", details: {
        invited_count: candidates.length,
        supplier_ids: candidates.map { |candidate| candidate.vendor.id }
      })
      if candidates.length < 3
        User.where(role: :admin).find_each do |operations_user|
          Notification.create!(user: operations_user, kind: "sourcing_exception",
                               title: candidates.empty? ? "RFQ needs manual sourcing" : "RFQ has fewer than three matches",
                               body: "#{@request_for_quote.reference} produced #{candidates.length} eligible supplier matches.",
                               data: { requestForQuoteId: @request_for_quote.id, matchCount: candidates.length })
        end
        @request_for_quote.record_trade_event!("rfq.manual_sourcing_required", details: { match_count: candidates.length })
      end
    end
    candidates
  end

  private

  def eligible_candidates
    Vendor.active.includes(:organization, :products, :supplier_capabilities).filter_map do |vendor|
      next unless vendor.business_ready?

      score, reasons = score(vendor)
      score&.positive? ? Candidate.new(vendor, score, reasons,
                                       SupplierInvitation.where(vendor_id: vendor.id).maximum(:invited_at)) : nil
    end
  end

  def score(vendor)
    score = 0
    reasons = []
    product = @request_for_quote.product
    quantity = requested_quantity
    destination = @request_for_quote.country.presence || @request_for_quote.destination_port
    capability = vendor.supplier_capabilities.find do |item|
      item.verified? &&
        (product.nil? || item.category_id.nil? || item.category_id == product.category_id) &&
        item.serves?(destination) && item.fits_quantity?(quantity)
    end

    return [ nil, [] ] unless capability

    if product && vendor.products.any? { |candidate| candidate.id == product.id && candidate.business_enabled? }
      score += 40
      reasons << "Exact product capability"
    elsif product && vendor.products.any? { |candidate| candidate.category_id == product.category_id && candidate.business_enabled? }
      score += 30
      reasons << "Category capability"
    elsif product
      return [ nil, [] ]
    end

    if capability&.serves?(destination)
      score += 20
      reasons << "Destination covered"
    elsif destination.blank?
      score += 10
      reasons << "Destination pending"
    end

    if capability&.fits_quantity?(quantity)
      score += 15
      reasons << "Quantity fits capacity"
    elsif quantity.positive?
      score += 5
      reasons << "Quantity requires confirmation"
    end

    lead_time = product&.lead_time_days
    if capability&.fits_lead_time?(lead_time)
      score += 15
      reasons << "Lead time fits"
    else
      score += 5
      reasons << "Lead time requires confirmation"
    end

    if vendor.organization&.verified?
      score += 10
      reasons << "Verified supplier organization"
    end

    [ score, reasons ]
  end

  def requested_quantity
    @requested_quantity ||= @request_for_quote.estimated_quantity.to_s[/\d[\d,]*/].to_s.delete(",").to_i
  end
end
