class RequestForQuote::Matching
  # The five criteria the delivery plan fixed. Published to the buyer and to
  # Operations so a ranking can be argued with rather than taken on trust.
  CRITERIA = [
    { key: "product_fit", label: "Product or category fit", max: 40 },
    { key: "destination", label: "Destination coverage", max: 20 },
    { key: "quantity", label: "Quantity and MOQ fit", max: 15 },
    { key: "lead_time", label: "Requested lead time fit", max: 15 },
    { key: "verification", label: "Supplier verification", max: 10 }
  ].freeze

  MAX_SCORE = CRITERIA.sum { |criterion| criterion[:max] }
  INVITE_LIMIT = 5

  # `detail` is the reason code stored on the invitation; `note` is what the
  # match console shows. They differ only for zero-point criteria, which explain
  # themselves in the console without becoming a claimed strength on the record.
  Component = Data.define(:key, :label, :points, :max, :detail, :note)
  Candidate = Data.define(:vendor, :score, :reasons, :last_invited_at, :components)
  Exclusion = Data.define(:vendor, :reason)

  def initialize(request_for_quote)
    @request_for_quote = request_for_quote
  end

  def invite!
    candidates = ranked_candidates.first(INVITE_LIMIT)

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
        supplier_ids: candidates.map { |candidate| candidate.vendor.id },
        scores: candidates.to_h { |candidate| [ candidate.vendor.id, candidate.score ] }
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

  # Read-only view of the same ranking, for the buyer's match console and the
  # Operations monitor. Runs the identical scorer so what is displayed is what
  # the invitation step actually used.
  def report
    ranked = ranked_candidates
    { candidates: ranked, shortlisted: ranked.first(INVITE_LIMIT), excluded: exclusions }
  end

  private

  def ranked_candidates
    @ranked_candidates ||= eligible_candidates.sort_by do |candidate|
      [ -candidate.score, candidate.last_invited_at || Time.at(0), candidate.vendor.id ]
    end
  end

  def considered_vendors
    @considered_vendors ||= Vendor.active.includes(:organization, :products, :supplier_capabilities).to_a
  end

  def eligible_candidates
    considered_vendors.filter_map do |vendor|
      next unless vendor.business_ready?

      components = evaluate(vendor)
      next if components.nil?

      score = components.sum(&:points)
      next unless score.positive?

      Candidate.new(vendor, score, components.filter_map(&:detail),
                    SupplierInvitation.where(vendor_id: vendor.id).maximum(:invited_at), components)
    end
  end

  def exclusions
    considered_vendors.filter_map do |vendor|
      next Exclusion.new(vendor, "Supplier organization is not verified") unless vendor.business_ready?
      next if evaluate(vendor)

      Exclusion.new(vendor, exclusion_reason(vendor))
    end
  end

  def exclusion_reason(vendor)
    return "No verified capability covering this category, destination or quantity" unless capability_for(vendor)

    "No Business-enabled product in the requested category"
  end

  def capability_for(vendor)
    product = @request_for_quote.product
    vendor.supplier_capabilities.find do |item|
      item.verified? &&
        (product.nil? || item.category_id.nil? || item.category_id == product.category_id) &&
        item.serves?(destination) && item.fits_quantity?(requested_quantity)
    end
  end

  # Returns the per-criterion breakdown, or nil when the supplier is not
  # eligible at all. The point values here are the contract with the buyer.
  def evaluate(vendor)
    capability = capability_for(vendor)
    return nil unless capability

    product = @request_for_quote.product
    components = []

    if product && vendor.products.any? { |candidate| candidate.id == product.id && candidate.business_enabled? }
      components << component("product_fit", 40, "Exact product capability")
    elsif product && vendor.products.any? { |candidate| candidate.category_id == product.category_id && candidate.business_enabled? }
      components << component("product_fit", 30, "Category capability")
    elsif product
      return nil
    else
      components << component("product_fit", 0, nil, "Open requirement, no catalogue product attached")
    end

    if capability.serves?(destination)
      components << component("destination", 20, "Destination covered")
    elsif destination.blank?
      components << component("destination", 10, "Destination pending")
    else
      components << component("destination", 0, nil, "Destination not covered")
    end

    if capability.fits_quantity?(requested_quantity)
      components << component("quantity", 15, "Quantity fits capacity")
    elsif requested_quantity.positive?
      components << component("quantity", 5, "Quantity requires confirmation")
    else
      components << component("quantity", 0, nil, "Quantity not stated")
    end

    if capability.fits_lead_time?(product&.lead_time_days)
      components << component("lead_time", 15, "Lead time fits")
    else
      components << component("lead_time", 5, "Lead time requires confirmation")
    end

    if vendor.organization&.verified?
      components << component("verification", 10, "Verified supplier organization")
    else
      components << component("verification", 0, nil, "Organization verification incomplete")
    end

    components
  end

  def component(key, points, detail, note = nil)
    criterion = CRITERIA.find { |item| item[:key] == key }
    Component.new(key, criterion[:label], points, criterion[:max], detail, note || detail)
  end

  def destination
    @destination ||= @request_for_quote.country.presence || @request_for_quote.destination_port
  end

  def requested_quantity
    @requested_quantity ||= @request_for_quote.estimated_quantity.to_s[/\d[\d,]*/].to_s.delete(",").to_i
  end
end
