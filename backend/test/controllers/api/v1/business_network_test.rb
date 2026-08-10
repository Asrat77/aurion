require "test_helper"

module Api
  module V1
    # The Business storefront and match console read from these endpoints. What
    # matters is that they publish measured values and never dress an absent
    # measurement up as a number.
    class BusinessNetworkTest < ActionDispatch::IntegrationTest
      def setup
        @category = Category.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(4)}")
        @other_category = Category.create!(name: "Spices", slug: "spices-#{SecureRandom.hex(4)}")
        @buyer = User.create!(email: "buyer-#{SecureRandom.hex(4)}@example.com", password: "password123", name: "Buyer", role: :buyer)
        @buyer_org = Organization.create!(name: "Buyer Co", kind: "buyer", status: "active",
                                          verification_status: "verified", country: "Ethiopia")
        @buyer_org.memberships.create!(user: @buyer, role: "owner")

        @verified_vendor = build_supplier("Verified Supplier", verified: true, region: "Oromia",
                                          certifications: [ "Organic" ])
        @unverified_vendor = build_supplier("Unverified Supplier", verified: false, region: "Amhara",
                                            certifications: [ "Fairtrade" ])
      end

      def build_supplier(name, verified:, region:, certifications:)
        user = User.create!(email: "supplier-#{SecureRandom.hex(4)}@example.com", password: "password123",
                            name: name, role: :vendor)
        organization = Organization.create!(name: name, kind: "supplier", status: "active", country: "Ethiopia",
                                            verification_status: verified ? "verified" : "unverified")
        organization.memberships.create!(user: user, role: "owner")
        vendor = ::Vendor.create!(user: user, organization: organization, store_name: name, status: :active,
                                  country: "Ethiopia", city: "Addis Ababa")
        Product.create!(vendor: vendor, category: @category, name: "#{name} Coffee", price_cents: 2_000,
                        stock: 1_000, status: :active, business_enabled: true, lead_time_days: 14)
        SupplierCapability.create!(vendor: vendor, category: @category, destinations: [ "Ethiopia" ],
                                   min_quantity: 10, max_lead_time_days: 30, verified: true,
                                   region: region, certifications: certifications)
        vendor
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
        assert_response :success
      end

      test "network snapshot reports measured counts and an unmeasured response time as null" do
        get "/api/v1/business/network"
        assert_response :success
        body = JSON.parse(response.body)

        assert_equal 2, body.dig("suppliers", "total")
        assert_equal 1, body.dig("suppliers", "verified")
        assert_equal 2, body.dig("catalogue", "products")
        # No supplier has answered an invitation, so there is nothing to average.
        assert_nil body.dig("sourcing", "medianResponseHours")
      end

      test "network snapshot never claims protection the deployment cannot perform" do
        previous = ENV["PROTECTED_PAYMENT_PROVIDER"]
        ENV["PROTECTED_PAYMENT_PROVIDER"] = "some-unregistered-provider"

        get "/api/v1/business/network"
        assert_response :success
        protection = JSON.parse(response.body).fetch("protection")
        assert_equal "disabled", protection.fetch("mode")
        assert_equal false, protection.fetch("live")
      ensure
        ENV["PROTECTED_PAYMENT_PROVIDER"] = previous
      end

      test "supplier directory filters on verified capabilities and exposes real facets" do
        get "/api/v1/business/suppliers"
        assert_response :success
        assert_equal 2, JSON.parse(response.body).fetch("suppliers").length

        get "/api/v1/business/suppliers", params: { region: "Oromia" }
        names = JSON.parse(response.body).fetch("suppliers").map { |row| row.fetch("name") }
        assert_equal [ "Verified Supplier" ], names

        get "/api/v1/business/suppliers", params: { certification: "Fairtrade" }
        assert_equal [ "Unverified Supplier" ], JSON.parse(response.body).fetch("suppliers").map { |row| row.fetch("name") }

        get "/api/v1/business/suppliers", params: { verified: true }
        suppliers = JSON.parse(response.body).fetch("suppliers")
        assert_equal [ "Verified Supplier" ], suppliers.map { |row| row.fetch("name") }
        assert suppliers.first.fetch("verified")

        get "/api/v1/business/suppliers", params: { category: @other_category.slug }
        assert_empty JSON.parse(response.body).fetch("suppliers")
      end

      test "match console explains every score and is scoped to the buyer organization" do
        login_as(@buyer)
        product = @verified_vendor.products.first
        post "/api/v1/business/organizations/#{@buyer_org.id}/request_for_quotes", params: {
          request_for_quote: {
            company_name: "Buyer Co", contact_name: "Buyer", email: @buyer.email, country: "Ethiopia",
            product_interest: "Coffee", product_id: product.id, estimated_quantity: "100 kg",
            specifications: "Washed grade", currency: "USD"
          }
        }, headers: { "Idempotency-Key" => "rfq-match-1" }, as: :json
        assert_response :created
        rfq_id = JSON.parse(response.body).fetch("id")

        post "/api/v1/business/request_for_quotes/#{rfq_id}/publication", params: {},
             headers: { "Idempotency-Key" => "rfq-match-publish-1" }, as: :json
        assert_response :success

        get "/api/v1/business/request_for_quotes/#{rfq_id}/matching"
        assert_response :success
        report = JSON.parse(response.body)

        assert_equal 100, report.fetch("maxScore")
        assert_equal 5, report.fetch("criteria").length

        candidate = report.fetch("candidates").find { |row| row.fetch("vendorName") == "Verified Supplier" }
        assert candidate, "the eligible supplier should be ranked"
        assert candidate.fetch("invited")
        # The published breakdown must add up to the score the buyer is shown.
        assert_equal candidate.fetch("score"), candidate.fetch("breakdown").sum { |row| row.fetch("points") }
        assert_equal RequestForQuote::Matching::CRITERIA.length, candidate.fetch("breakdown").length

        # The unverified supplier is ruled out, and the reason is stated.
        excluded = report.fetch("excluded").map { |row| row.fetch("vendorName") }
        assert_includes excluded, "Unverified Supplier"

        other = User.create!(email: "other-#{SecureRandom.hex(4)}@example.com", password: "password123",
                             name: "Other", role: :buyer)
        login_as(other)
        get "/api/v1/business/request_for_quotes/#{rfq_id}/matching"
        assert_response :not_found
      end

      test "operations sourcing monitor is admin only and surfaces thin shortlists" do
        get "/api/v1/admin/business/sourcing"
        assert_response :unauthorized

        login_as(@buyer)
        get "/api/v1/admin/business/sourcing"
        assert_response :forbidden

        rfq = @buyer_org.request_for_quotes.create!(
          buyer: @buyer, company_name: "Buyer Co", contact_name: "Buyer", email: @buyer.email,
          country: "Ethiopia", product_interest: "Rare spice", estimated_quantity: "10 kg",
          specifications: "None available", status: "open"
        )

        admin = User.create!(email: "admin-#{SecureRandom.hex(4)}@example.com", password: "password123",
                             name: "Admin", role: :admin)
        login_as(admin)
        get "/api/v1/admin/business/sourcing"
        assert_response :success
        body = JSON.parse(response.body)

        exception = body.fetch("exceptions").find { |row| row.fetch("requestForQuoteId") == rfq.id }
        assert exception, "an unmatched RFQ must reach the Operations queue"
        assert_equal "manual_sourcing", exception.fetch("severity")
        assert_equal 0, body.dig("funnel", "invited")
      end
    end
  end
end
