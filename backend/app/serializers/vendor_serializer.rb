class VendorSerializer
  def self.render(vendor)
    return nil unless vendor

    {
      id: vendor.id,
      storeName: vendor.store_name,
      slug: vendor.slug,
      commissionRate: vendor.commission_rate.to_f,
      status: vendor.status,
      bio: vendor.bio,
    }
  end
end
