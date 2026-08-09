module Business
  # The verified supplier directory. Every attribute is stored on the vendor,
  # its organization, or an administrator-verified capability row. Nothing here
  # is inferred or decorated: an unverified supplier is shown as unverified.
  class SupplierDirectory
    def self.call(...) = new(...).call

    def initialize(region: nil, category: nil, certification: nil, verified_only: false, query: nil, limit: 60)
      @region = region.presence
      @category = category.presence
      @certification = certification.presence
      @verified_only = ActiveModel::Type::Boolean.new.cast(verified_only)
      @query = query.presence
      @limit = limit.to_i.clamp(1, 200)
    end

    def call
      { suppliers: suppliers, facets: facets }
    end

    private

    def base
      scope = Vendor.active.joins(:organization)
                    .where(organizations: { kind: "supplier", status: "active" })
                    .includes(:organization, :supplier_capabilities, products: :category)
      scope = scope.where(organizations: { verification_status: "verified" }) if @verified_only
      scope = scope.where("LOWER(vendors.store_name) LIKE ?", "%#{@query.downcase}%") if @query
      scope
    end

    def suppliers
      base.to_a.filter_map { |vendor| render(vendor) if matches_filters?(vendor) }
          .sort_by { |row| [ row[:verified] ? 0 : 1, -row[:businessProducts], row[:name] ] }
          .first(@limit)
    end

    def matches_filters?(vendor)
      capabilities = verified_capabilities(vendor)
      return false if @region && capabilities.none? { |item| item.region.to_s.casecmp?(@region) }
      return false if @certification && capabilities.none? { |item| certifications_of(item).any? { |value| value.casecmp?(@certification) } }
      return false if @category && business_products(vendor).none? { |product| product.category&.slug == @category }

      true
    end

    def verified_capabilities(vendor)
      vendor.supplier_capabilities.select(&:verified?)
    end

    def certifications_of(capability)
      Array(capability.certifications).map(&:to_s)
    end

    def business_products(vendor)
      vendor.products.select(&:business_enabled?)
    end

    def render(vendor)
      capabilities = verified_capabilities(vendor)
      products = business_products(vendor)
      {
        id: vendor.id,
        slug: vendor.slug,
        name: vendor.store_name,
        organizationName: vendor.organization&.name,
        verified: vendor.organization&.verified? || false,
        country: vendor.country,
        city: vendor.city,
        regions: capabilities.filter_map { |item| item.region.presence }.uniq,
        certifications: capabilities.flat_map { |item| certifications_of(item) }.uniq,
        categories: products.filter_map { |product| product.category&.name }.uniq,
        businessProducts: products.length,
        minQuantity: capabilities.filter_map(&:min_quantity).min,
        maxLeadTimeDays: capabilities.filter_map(&:max_lead_time_days).max,
        destinations: capabilities.flat_map { |item| Array(item.destinations).map(&:to_s) }.uniq,
        # Track record, straight from the trade tables.
        invitations: SupplierInvitation.where(vendor_id: vendor.id).count,
        quotationsSubmitted: Quotation.where(vendor_id: vendor.id).where.not(submitted_at: nil).count,
        tradesCompleted: TradeOrder.where(supplier_organization_id: vendor.organization_id, status: "settled").count
      }
    end

    # Facets are counted across verified capabilities only, so a filter never
    # offers an option that no buyer-visible supplier actually holds.
    def facets
      capabilities = SupplierCapability.where(verified: true, vendor_id: Vendor.active.select(:id))
      {
        regions: capabilities.where.not(region: [ nil, "" ]).group(:region).count
                             .map { |region, count| { value: region, count: count } }
                             .sort_by { |row| -row[:count] },
        certifications: capabilities.flat_map { |item| certifications_of(item) }
                                    .tally
                                    .map { |value, count| { value: value, count: count } }
                                    .sort_by { |row| -row[:count] },
        categories: Category.joins(:products)
                            .where(products: { business_enabled: true })
                            .group("categories.id", "categories.name", "categories.slug")
                            .count
                            .map { |(_, name, slug), count| { value: slug, label: name, count: count } }
                            .sort_by { |row| -row[:count] }
      }
    end
  end
end
