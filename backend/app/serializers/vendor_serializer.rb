class VendorSerializer
  def self.render(vendor, include_application: false)
    return nil unless vendor

    hash = {
      id: vendor.id,
      storeName: vendor.store_name,
      slug: vendor.slug,
      commissionRate: vendor.commission_rate.to_f,
      status: vendor.status,
      bio: vendor.bio
    }

    if include_application
      hash.merge!(
        contactName: vendor.contact_name,
        contactPhone: vendor.contact_phone,
        businessRegistration: vendor.business_registration,
        city: vendor.city,
        country: vendor.country,
        website: vendor.website,
        productFocus: vendor.product_focus,
        payoutMethod: vendor.payout_method,
        appliedAt: vendor.applied_at,
        reviewedAt: vendor.reviewed_at,
        reviewNote: vendor.review_note,
        ownerEmail: vendor.user.email,
      )
    end

    hash
  end
end
