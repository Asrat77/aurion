class MatchingReportSerializer
  # Turns the deterministic scorer into something a buyer can audit: the
  # criteria, every candidate's per-criterion points, who was invited, who
  # answered, and who was ruled out and why.
  def self.render(rfq, report)
    invitations = rfq.supplier_invitations.index_by(&:vendor_id)
    quotations = rfq.quotations.group_by(&:vendor_id)

    {
      requestForQuoteId: rfq.id,
      reference: rfq.reference,
      status: rfq.status,
      maxScore: RequestForQuote::Matching::MAX_SCORE,
      inviteLimit: RequestForQuote::Matching::INVITE_LIMIT,
      criteria: RequestForQuote::Matching::CRITERIA.map { |item| { key: item[:key], label: item[:label], max: item[:max] } },
      candidates: report[:candidates].map { |candidate| candidate_row(candidate, invitations, quotations) },
      shortlisted: report[:shortlisted].map { |candidate| candidate.vendor.id },
      excluded: report[:excluded].map { |exclusion| { vendorId: exclusion.vendor.id, vendorName: exclusion.vendor.store_name, reason: exclusion.reason } },
      funnel: funnel(rfq),
      events: rfq.trade_events.order(:created_at).map do |event|
        { event: event.event_type, occurredAt: event.created_at.iso8601, details: event.details }
      end
    }
  end

  def self.candidate_row(candidate, invitations, quotations)
    invitation = invitations[candidate.vendor.id]
    quotation = quotations[candidate.vendor.id]&.max_by(&:revision)
    {
      vendorId: candidate.vendor.id,
      vendorName: candidate.vendor.store_name,
      organizationName: candidate.vendor.organization&.name,
      verified: candidate.vendor.organization&.verified? || false,
      score: candidate.score,
      reasons: candidate.reasons,
      breakdown: candidate.components.map do |component|
        { key: component.key, label: component.label, points: component.points, max: component.max, note: component.note }
      end,
      invited: invitation.present?,
      invitationStatus: invitation&.status,
      invitedAt: invitation&.invited_at&.iso8601,
      respondedAt: invitation&.responded_at&.iso8601,
      quotationId: quotation&.id,
      quotationStatus: quotation&.status,
      quotationTotalCents: quotation&.total_cents
    }
  end
  private_class_method :candidate_row

  def self.funnel(rfq)
    counts = rfq.supplier_invitations.group(:status).count
    {
      invited: rfq.supplier_invitations.count,
      viewed: counts.fetch("viewed", 0),
      quoted: counts.fetch("quoted", 0),
      declined: counts.fetch("declined", 0),
      awarded: counts.fetch("awarded", 0)
    }
  end
  private_class_method :funnel
end
