module Business
  # Everything the Business landing page and directory quote about the network,
  # measured from the database at request time.
  #
  # A figure with no underlying data is reported as nil rather than zero-dressed
  # or invented, so the storefront can say "not measured yet" instead of
  # publishing a number nobody can defend.
  class NetworkSnapshot
    def self.call = new.call

    def call
      {
        suppliers: suppliers,
        catalogue: catalogue,
        sourcing: sourcing,
        trades: trades,
        protection: protection,
        measuredAt: Time.current.iso8601
      }
    end

    private

    def business_vendors
      @business_vendors ||= Vendor.active.joins(:organization)
                                  .where(organizations: { kind: "supplier", status: "active" })
    end

    def verified_vendors
      @verified_vendors ||= business_vendors.where(organizations: { verification_status: "verified" })
    end

    def suppliers
      {
        total: business_vendors.count,
        verified: verified_vendors.count,
        countries: business_vendors.where.not(country: [ nil, "" ]).distinct.count(:country),
        regions: SupplierCapability.where(verified: true, vendor_id: verified_vendors.select(:id))
                                   .where.not(region: [ nil, "" ])
                                   .group(:region).count
                                   .map { |region, count| { region: region, suppliers: count } }
                                   .sort_by { |row| -row[:suppliers] }
      }
    end

    def catalogue
      scope = Product.where(vendor_id: business_vendors.select(:id)).where(business_enabled: true)
      {
        products: scope.count,
        categories: Category.where(id: scope.select(:category_id)).order(:name).map do |category|
          products = scope.where(category_id: category.id)
          {
            id: category.id,
            name: category.name,
            slug: category.slug,
            emoji: category.try(:emoji),
            products: products.count,
            suppliers: products.distinct.count(:vendor_id)
          }
        end
      }
    end

    def sourcing
      published = RequestForQuote.where(status: %w[open reviewing awarded closed])
      {
        openRequests: RequestForQuote.where(status: "open").count,
        invitationsSent: SupplierInvitation.count,
        quotationsSubmitted: Quotation.where.not(submitted_at: nil).count,
        requestsMatched: published.joins(:supplier_invitations).distinct.count,
        medianResponseHours: median_response_hours
      }
    end

    # Median hours between a supplier being invited and answering. nil until at
    # least one supplier has actually responded.
    def median_response_hours
      gaps = SupplierInvitation.where.not(responded_at: nil)
                               .pluck(:invited_at, :responded_at)
                               .filter_map { |invited, responded| ((responded - invited) / 3600.0).round(1) if invited && responded }
      return nil if gaps.empty?

      sorted = gaps.sort
      middle = sorted.length / 2
      sorted.length.odd? ? sorted[middle] : ((sorted[middle - 1] + sorted[middle]) / 2.0).round(1)
    end

    def trades
      active = TradeOrder.where.not(status: %w[cancelled settled])
      funded = ProtectedPayment.where(status: %w[funded released partially_released])
      {
        active: active.count,
        completed: TradeOrder.where(status: "settled").count,
        protectedCents: funded.sum(:amount_cents),
        currency: funded.first&.currency || TradeOrder.first&.currency || "USD"
      }
    end

    # Never advertise protection the deployment cannot actually perform.
    def protection
      provider = ProtectedPayments::Provider.mode
      { mode: provider, live: provider == "live", label: ProtectedPayments::Provider.status_label }
    end
  end
end
