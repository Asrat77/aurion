class OrganizationSerializer
  def self.render(organization, include_memberships: false)
    body = {
      id: organization.id,
      name: organization.name,
      legalName: organization.legal_name,
      kind: organization.kind,
      status: organization.status,
      verificationStatus: organization.verification_status,
      country: organization.country,
      registrationNumber: organization.registration_number,
      verifiedAt: organization.verified_at&.iso8601
    }
    if include_memberships
      body[:memberships] = organization.memberships.includes(:user).map do |membership|
        { id: membership.id, userId: membership.user_id, name: membership.user.name,
          email: membership.user.email, role: membership.role, status: membership.status }
      end
    end
    body
  end
end
