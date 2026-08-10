module AiAssistant
  # Builds the grounding block the model is allowed to answer from.
  #
  # Everything here is read out of our own database and scoped to what the
  # asker may already see: the public catalogue, the public supplier directory,
  # and that user's own orders, requests and trades. The model is never asked
  # to recall facts about AURION on its own.
  class Context
    MAX_PRODUCTS = 6
    MAX_SUPPLIERS = 5
    TERM_MATCH = "LOWER(products.name) LIKE :term OR LOWER(products.description) LIKE :term".freeze

    def initialize(task:, question:, user: nil)
      @task = task
      @question = question.to_s
      @user = user
    end

    def build
      sections = @task == "business_sourcing" ? business_sections : express_sections
      present = sections.reject { |section| section[:rows].empty? }

      {
        text: render(present),
        summary: present.to_h { |section| [ section[:key], section[:rows].length ] }
      }
    end

    private

    # Keyword search over the catalogue. Deliberately simple and deterministic:
    # the point is to put real rows in front of the model, not to rank them.
    def terms
      @terms ||= @question.downcase.scan(/[a-z][a-z0-9'-]{2,}/).uniq.first(8)
    end

    def product_matches(channel)
      scope = Product.active.includes(:category, :vendor)
      scope = channel == :business ? scope.for_business : scope.for_express
      return scope.limit(MAX_PRODUCTS).to_a if terms.empty?

      # Composed with `or` rather than a built-up SQL string: the fragment stays
      # a literal with bound parameters, which is both safer and legible.
      matched = terms
                .map { |term| scope.where(TERM_MATCH, term: "%#{term}%") }
                .reduce { |combined, relation| combined.or(relation) }
                .limit(MAX_PRODUCTS).to_a

      # Falling back to the head of the catalogue keeps the model grounded in
      # real rows rather than leaving it to answer from memory.
      matched.presence || scope.limit(MAX_PRODUCTS).to_a
    end

    def express_sections
      [
        {
          key: "products",
          title: "Catalogue products (retail)",
          rows: product_matches(:express).map do |product|
            "#{product.name} (#{product.category&.name}) sold by #{product.vendor&.store_name}. " \
              "Price #{money(product.price_cents, product.currency)}. " \
              "#{product.stock.to_i.positive? ? "In stock: #{product.stock}." : "Out of stock."} " \
              "Free shipping: #{product.free_shipping ? "yes" : "no"}."
          end
        },
        {
          key: "orders",
          title: "This customer's recent orders",
          rows: recent_orders
        },
        {
          key: "policy",
          title: "Buyer protection policy",
          rows: [
            "A buyer can request a refund on a delivered order through the order page.",
            "Refund requests are reviewed by AURION support; approval is recorded before any money moves.",
            "Order status values are: pending, paid, processing, shipped, delivered, cancelled."
          ]
        }
      ]
    end

    def business_sections
      [
        {
          key: "wholesale",
          title: "Wholesale catalogue (Business channel)",
          rows: product_matches(:business).map do |product|
            terms_text = if product.moq.present?
              "MOQ #{product.moq} #{product.unit_of_measure}, lead time #{product.lead_time_days || "unstated"} days"
            else
              "wholesale terms not published"
            end
            "#{product.name} (#{product.category&.name}) from #{product.vendor&.store_name}. " \
              "Indicative unit #{money(product.price_cents, product.currency)}. #{terms_text}."
          end
        },
        {
          key: "suppliers",
          title: "Verified suppliers",
          rows: suppliers
        },
        {
          key: "requests",
          title: "This buyer's own requests and trades",
          rows: own_requests
        },
        {
          key: "process",
          title: "How AURION Business works",
          rows: [
            "Matching scores eligible suppliers out of 100: product or category fit 40, destination coverage 20, " \
              "quantity and MOQ fit 15, lead time fit 15, supplier verification 10. The top five are invited.",
            "A submitted quotation is immutable; a supplier revises by submitting a new revision.",
            "Accepting one quotation creates a trade order with a hashed contract both parties must accept.",
            ProtectedPayments::Provider.status_label
          ]
        }
      ]
    end

    def suppliers
      directory = ::Business::SupplierDirectory.call(verified_only: true, limit: MAX_SUPPLIERS)
      directory[:suppliers].map do |supplier|
        "#{supplier[:name]}#{supplier[:city] ? " in #{supplier[:city]}" : ""}. " \
          "Categories: #{supplier[:categories].presence&.join(", ") || "none published"}. " \
          "Certifications: #{supplier[:certifications].presence&.join(", ") || "none recorded"}. " \
          "Wholesale SKUs: #{supplier[:businessProducts]}. Settled trades: #{supplier[:tradesCompleted]}."
      end
    end

    def recent_orders
      return [] unless @user

      @user.orders.order(created_at: :desc).limit(3).map do |order|
        "Order #{order.reference}: #{order.status}, placed #{order.created_at.to_date}, " \
          "total #{money(order.total_cents, order.currency)}."
      end
    rescue NoMethodError
      []
    end

    def own_requests
      return [] unless @user

      organization_ids = @user.organizations.active.select(:id)
      rows = RequestForQuote.where(organization_id: organization_ids).order(created_at: :desc).limit(3).map do |rfq|
        "Request #{rfq.reference}: #{rfq.product_interest}, #{rfq.estimated_quantity}, status #{rfq.status}, " \
          "#{rfq.supplier_invitations.count} suppliers invited."
      end
      rows + TradeOrder.where(buyer_organization_id: organization_ids).order(created_at: :desc).limit(3).map do |trade|
        "Trade #{trade.reference}: #{trade.status}, #{money(trade.total_cents, trade.currency)}."
      end
    end

    def money(cents, currency)
      format("%s %.2f", currency || "USD", cents.to_i / 100.0)
    end

    def render(sections)
      return "No matching AURION records were found for this question." if sections.empty?

      sections.map do |section|
        "## #{section[:title]}\n" + section[:rows].map { |row| "- #{row}" }.join("\n")
      end.join("\n\n")
    end
  end
end
