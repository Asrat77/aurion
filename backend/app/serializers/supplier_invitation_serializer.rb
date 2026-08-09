class SupplierInvitationSerializer
  def self.render(invitation)
    {
      id: invitation.id,
      requestForQuoteId: invitation.request_for_quote_id,
      reference: invitation.request_for_quote.reference,
      vendorId: invitation.vendor_id,
      vendorName: invitation.vendor.store_name,
      score: invitation.score,
      reasons: invitation.reasons,
      status: invitation.status,
      invitedAt: invitation.invited_at&.iso8601
    }
  end
end
