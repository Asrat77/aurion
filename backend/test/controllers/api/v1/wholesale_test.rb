require "test_helper"

module Api
  module V1
    class WholesaleTest < ActionDispatch::IntegrationTest
      def setup
        @category = Category.create!(name: "Coffee", slug: "coffee")
        user = User.create!(email: "vendor@example.com", password: "password123", name: "V", role: :vendor)
        @vendor = ::Vendor.create!(user: user, store_name: "Test Vendor", status: :active)
        @vendor_user = user

        @wholesale = Product.create!(vendor: @vendor, category: @category, name: "Bulk Coffee",
                                      price_cents: 2_800, stock: 10_000, status: :active,
                                      moq: 500, unit_of_measure: "kg", lead_time_days: 21,
                                      packaging: "60kg jute bags", sample_available: true,
                                      sample_price_cents: 3_500)
        @wholesale.price_tiers.create!(min_quantity: 500, unit_price_cents: 2_400)
        @wholesale.price_tiers.create!(min_quantity: 2_000, unit_price_cents: 2_150)

        @retail_only = Product.create!(vendor: @vendor, category: @category, name: "Retail Coffee",
                                        price_cents: 2_800, stock: 100, status: :active)

        @admin = User.create!(email: "admin@example.com", password: "password123", name: "Admin", role: :admin)
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
      end

      test "the wholesale catalogue lists only products with commercial terms" do
        get "/api/v1/request_for_quotes/catalogue"
        assert_response :success

        body = JSON.parse(response.body)
        assert_equal [ "Bulk Coffee" ], body.map { |p| p["name"] }

        terms = body.first["wholesale"]
        assert_equal 500, terms["moq"]
        assert_equal "kg", terms["unitOfMeasure"]
        assert_equal 21, terms["leadTimeDays"]
        assert terms["sampleAvailable"]
        assert_equal 2, terms["priceTiers"].length
      end

      test "a retail-only product carries no wholesale block" do
        get "/api/v1/products/#{@retail_only.slug}"
        assert_nil JSON.parse(response.body)["wholesale"]
      end

      test "tiered pricing picks the best break the quantity qualifies for" do
        assert_equal 2_800, @wholesale.unit_price_for(1), "below MOQ falls back to retail"
        assert_equal 2_800, @wholesale.unit_price_for(499)
        assert_equal 2_400, @wholesale.unit_price_for(500)
        assert_equal 2_400, @wholesale.unit_price_for(1_999)
        assert_equal 2_150, @wholesale.unit_price_for(2_000)
        assert_equal 2_150, @wholesale.unit_price_for(50_000)
      end

      test "a tier cannot be duplicated at the same quantity" do
        duplicate = @wholesale.price_tiers.build(min_quantity: 500, unit_price_cents: 1)
        refute duplicate.valid?
      end

      test "an RFQ can name a product, incoterm and sample request" do
        post "/api/v1/request_for_quotes", params: {
          request_for_quote: {
            company_name: "Nordic Roasters", email: "buyer@nordic.example",
            product_interest: "Green coffee", product_id: @wholesale.id,
            estimated_quantity: "2000 kg", incoterm: "FOB", destination_port: "Djibouti",
            target_price_cents: 2_100, sample_requested: true,
          },
        }, as: :json

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "FOB", body["incoterm"]
        assert_equal "Djibouti", body["destinationPort"]
        assert_equal @wholesale.id, body["productId"]
        assert_equal "Bulk Coffee", body["productName"]
        assert body["sampleRequested"]
        assert_equal "new", body["status"]
      end

      test "an unknown incoterm is rejected" do
        post "/api/v1/request_for_quotes", params: {
          request_for_quote: {
            company_name: "Nordic Roasters", email: "buyer@nordic.example",
            product_interest: "Green coffee", incoterm: "NOPE",
          },
        }, as: :json

        assert_response :unprocessable_entity
      end

      test "an admin can quote a request and it moves to quoted" do
        rfq = RequestForQuote.create!(company_name: "Nordic Roasters", email: "buyer@nordic.example",
                                       product_interest: "Green coffee")

        login_as(@admin)
        post "/api/v1/admin/request_for_quotes/#{rfq.id}/quote", params: {
          quoted_unit_price_cents: 2_250, quoted_lead_time_days: 28,
          quote_note: "FOB Djibouti, 2026 harvest.",
        }, as: :json

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal "quoted", body["status"]
        assert_equal 2_250, body["quotedUnitPriceCents"]
        assert_equal 28, body["quotedLeadTimeDays"]
        assert body["quotedAt"].present?
      end

      test "a non-admin cannot quote" do
        rfq = RequestForQuote.create!(company_name: "Nordic Roasters", email: "buyer@nordic.example",
                                       product_interest: "Green coffee")

        login_as(@vendor_user)
        post "/api/v1/admin/request_for_quotes/#{rfq.id}/quote",
             params: { quoted_unit_price_cents: 1 }, as: :json
        assert_response :forbidden
        assert_equal "new", rfq.reload.status
      end

      test "an admin can move a request through its statuses" do
        rfq = RequestForQuote.create!(company_name: "Nordic Roasters", email: "buyer@nordic.example",
                                       product_interest: "Green coffee")

        login_as(@admin)
        patch "/api/v1/admin/request_for_quotes/#{rfq.id}", params: { status: "reviewing" }, as: :json
        assert_response :success
        assert_equal "reviewing", rfq.reload.status

        patch "/api/v1/admin/request_for_quotes/#{rfq.id}", params: { status: "nonsense" }, as: :json
        assert_response :unprocessable_entity
        assert_equal "reviewing", rfq.reload.status
      end

      test "a vendor sets wholesale terms and tiers on their own product" do
        login_as(@vendor_user)

        patch "/api/v1/vendor/products/#{@retail_only.id}", params: {
          moq: 250, unit_of_measure: "kg", lead_time_days: 14, sample_available: true,
          price_tiers: [
            { min_quantity: 250, unit_price_cents: 2_600 },
            { min_quantity: 1_000, unit_price_cents: 2_400 },
          ],
        }, as: :json

        assert_response :success
        terms = JSON.parse(response.body)["wholesale"]
        assert_equal 250, terms["moq"]
        assert_equal [ 250, 1_000 ], terms["priceTiers"].map { |t| t["minQuantity"] }
      end

      test "replacing tiers does not leave orphans behind" do
        login_as(@vendor_user)

        patch "/api/v1/vendor/products/#{@wholesale.id}", params: {
          price_tiers: [ { min_quantity: 750, unit_price_cents: 2_300 } ],
        }, as: :json

        assert_response :success
        assert_equal [ 750 ], @wholesale.reload.price_tiers.by_quantity.pluck(:min_quantity)
      end

      test "a vendor cannot set terms on another vendor's product" do
        other_user = User.create!(email: "other@example.com", password: "password123",
                                   name: "Other", role: :vendor)
        other_vendor = ::Vendor.create!(user: other_user, store_name: "Other Vendor", status: :active)
        other_product = Product.create!(vendor: other_vendor, category: @category, name: "Theirs",
                                         price_cents: 1_000, stock: 5, status: :active)

        login_as(@vendor_user)
        patch "/api/v1/vendor/products/#{other_product.id}", params: { moq: 999 }, as: :json

        assert_response :not_found
        assert_nil other_product.reload.moq
      end
    end
  end
end
