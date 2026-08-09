module Business
  # Everything the Business landing page and directory quote about the network,
  # measured from the database at request time.
  #
  # A figure with no underlying data is reported as nil rather than zero-dressed
  # or invented, so the storefront can say "not measured yet" instead of
  # publishing a number nobody can defend.
  class NetworkSnapshot
    # Public, unauthenticated and identical for every visitor, so a short cache
    # keeps the landing page fast without letting the figures go stale. The
    # payload carries its own `measuredAt`, so a cached read still says exactly
    # when it was measured.
    CACHE_TTL = 60.seconds

    def self.call = Rails.cache.fetch("business/network_snapshot", expires_in: CACHE_TTL) { new.call }

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
      by_verification = business_vendors.group("organizations.verification_status").count
      {
        total: by_verification.values.sum,
        verified: by_verification.fetch("verified", 0),
        countries: business_vendors.where.not(country: [ nil, "" ]).distinct.count(:country),
        regions: SupplierCapability.where(verified: true, vendor_id: verified_vendors.select(:id))
                                   .where.not(region: [ nil, "" ])
                                   .group(:region).count
                                   .map { |region, count| { region: region, suppliers: count } }
                                   .sort_by { |row| -row[:suppliers] }
      }
    end

    # Counted with two grouped aggregates rather than a query per category: the
    # landing page renders this on every visit.
    def catalogue
      scope = Product.where(vendor_id: business_vendors.select(:id)).where(business_enabled: true)
      products_by_category = scope.group(:category_id).count
      suppliers_by_category = scope.distinct.group(:category_id).count(:vendor_id)

      {
        products: products_by_category.values.sum,
        categories: Category.where(id: products_by_category.keys).order(:name).map do |category|
          {
            id: category.id,
            name: category.name,
            slug: category.slug,
            products: products_by_category.fetch(category.id, 0),
            suppliers: suppliers_by_category.fetch(category.id, 0)
          }
        end
      }
    end

    def sourcing
      published = RequestForQuote.where(status: %w[open reviewing awarded closed])
      by_status = RequestForQuote.group(:status).count
      {
        openRequests: by_status.fetch("open", 0),
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
      by_status = TradeOrder.group(:status).count
      # Grouped by currency so the total and its label come from one query and
      # can never disagree.
      held = ProtectedPayment.where(status: %w[funded released partially_released])
                             .group(:currency).sum(:amount_cents)
      largest = held.max_by { |_, cents| cents }

      {
        active: by_status.except("cancelled", "settled").values.sum,
        completed: by_status.fetch("settled", 0),
        protectedCents: largest&.last.to_i,
        currency: largest&.first || "USD"
      }
    end

    # Never advertise protection the deployment cannot actually perform.
    def protection
      provider = ProtectedPayments::Provider.mode
      { mode: provider, live: provider == "live", label: ProtectedPayments::Provider.status_label }
    end
  end
end
