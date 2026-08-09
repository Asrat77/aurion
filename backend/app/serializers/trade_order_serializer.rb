class TradeOrderSerializer
  def self.render(trade_order, include_events: true)
    body = {
      id: trade_order.id,
      reference: trade_order.reference,
      requestForQuoteId: trade_order.request_for_quote_id,
      quotationId: trade_order.quotation_id,
      buyerOrganizationId: trade_order.buyer_organization_id,
      supplierOrganizationId: trade_order.supplier_organization_id,
      supplierName: trade_order.vendor.store_name,
      status: trade_order.status,
      currency: trade_order.currency,
      subtotalCents: trade_order.subtotal_cents,
      shippingCents: trade_order.shipping_cents,
      totalCents: trade_order.total_cents,
      incoterm: trade_order.incoterm,
      destinationPort: trade_order.destination_port,
      terms: trade_order.terms,
      termsSha256: trade_order.terms_sha256,
      contractAvailable: trade_order.contract_document.attached?,
      inspectionRequired: trade_order.inspection_required,
      deliveryDueAt: trade_order.delivery_due_at&.iso8601,
      fundedAt: trade_order.funded_at&.iso8601,
      deliveredAt: trade_order.delivered_at&.iso8601,
      completedAt: trade_order.completed_at&.iso8601,
      acceptances: trade_order.acceptances.includes(:organization, :user).map do |acceptance|
        { organizationId: acceptance.organization_id, organizationName: acceptance.organization.name,
          userId: acceptance.user_id, userName: acceptance.user.name, role: acceptance.role,
          termsSha256: acceptance.terms_sha256, acceptedAt: acceptance.accepted_at.iso8601 }
      end,
      protectedPayment: trade_order.protected_payment && {
        provider: trade_order.protected_payment.provider,
        status: trade_order.protected_payment.status,
        amountCents: trade_order.protected_payment.amount_cents,
        currency: trade_order.protected_payment.currency,
        fundedAt: trade_order.protected_payment.funded_at&.iso8601,
        releasedAt: trade_order.protected_payment.released_at&.iso8601
      },
      inspection: trade_order.inspection && {
        id: trade_order.inspection.id, status: trade_order.inspection.status,
        outcome: trade_order.inspection.outcome, notes: trade_order.inspection.notes
      },
      shipment: trade_order.shipment && {
        id: trade_order.shipment.id, carrier: trade_order.shipment.carrier,
        trackingNumber: trade_order.shipment.tracking_number, status: trade_order.shipment.status,
        shippedAt: trade_order.shipment.shipped_at&.iso8601,
        deliveredAt: trade_order.shipment.delivered_at&.iso8601,
        deliveryVerifiedAt: trade_order.shipment.delivery_verified_at&.iso8601
      },
      disputes: trade_order.disputes.order(created_at: :desc).map do |dispute|
        { id: dispute.id, reason: dispute.reason, status: dispute.status,
          amountCents: dispute.amount_cents, detail: dispute.detail,
          createdAt: dispute.created_at.iso8601, resolvedAt: dispute.resolved_at&.iso8601 }
      end
    }
    body[:events] = trade_order.events.order(:created_at).map do |event|
      { type: event.event_type, details: event.details, actorId: event.actor_id, createdAt: event.created_at.iso8601 }
    end if include_events
    body
  end
end
