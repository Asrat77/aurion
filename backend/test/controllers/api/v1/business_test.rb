require "test_helper"

module Api
  module V1
    class BusinessTest < ActionDispatch::IntegrationTest
      def setup
        @previous_provider = ENV["PROTECTED_PAYMENT_PROVIDER"]
        @previous_sandbox_secret = ENV["SANDBOX_WEBHOOK_SECRET"]
        ENV["PROTECTED_PAYMENT_PROVIDER"] = "sandbox"
        ENV["SANDBOX_WEBHOOK_SECRET"] = "test-sandbox-secret"

        @category = Category.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(4)}")
        @buyer = User.create!(email: "buyer-#{SecureRandom.hex(4)}@example.com", password: "password123", name: "Buyer", role: :buyer)
        @supplier_user = User.create!(email: "supplier-#{SecureRandom.hex(4)}@example.com", password: "password123", name: "Supplier", role: :vendor)
        @admin = User.create!(email: "admin-#{SecureRandom.hex(4)}@example.com", password: "password123", name: "Admin", role: :admin)
        @buyer_org = Organization.create!(name: "Buyer Co", kind: "buyer", status: "active", verification_status: "verified", country: "Ethiopia")
        @buyer_org.memberships.create!(user: @buyer, role: "owner")
        @supplier_org = Organization.create!(name: "Supplier Co", kind: "supplier", status: "active", verification_status: "verified", country: "Ethiopia")
        @supplier_org.memberships.create!(user: @supplier_user, role: "owner")
        @vendor = ::Vendor.create!(user: @supplier_user, organization: @supplier_org, store_name: "Supplier Co", status: :active)
        @product = Product.create!(vendor: @vendor, category: @category, name: "Bulk Coffee", price_cents: 2_000,
                                   stock: 10_000, status: :active, business_enabled: true, lead_time_days: 14)
        SupplierCapability.create!(vendor: @vendor, category: @category, destinations: [ "Ethiopia" ], min_quantity: 10,
                                   max_lead_time_days: 30, verified: true)
      end

      def teardown
        ENV["PROTECTED_PAYMENT_PROVIDER"] = @previous_provider
        ENV["SANDBOX_WEBHOOK_SECRET"] = @previous_sandbox_secret
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
        assert_response :success
      end

      test "organization creation replays safely with an idempotency key" do
        login_as(@buyer)
        payload = { organization: { name: "Repeatable Buyer", kind: "buyer", country: "Ethiopia" } }
        post "/api/v1/business/organizations", params: payload, headers: { "Idempotency-Key" => "org-create-1" }, as: :json
        assert_response :created
        first = JSON.parse(response.body)

        post "/api/v1/business/organizations", params: payload, headers: { "Idempotency-Key" => "org-create-1" }, as: :json
        assert_response :created
        assert_equal first["id"], JSON.parse(response.body)["id"]

        post "/api/v1/business/organizations", params: { organization: { name: "Different", kind: "buyer" } },
             headers: { "Idempotency-Key" => "org-create-1" }, as: :json
        assert_response :conflict
      end

      test "payment webhooks reject an invalid raw-body signature before processing" do
        payload = { id: "evt-invalid", type: "payment.funded", data: { payment_id: 999_999 } }
        post "/api/v1/webhooks/payments/sandbox", params: JSON.generate(payload),
             headers: { "CONTENT_TYPE" => "application/json", "X-Provider-Signature" => "invalid" }
        assert_response :unprocessable_entity
        assert_equal 0, ProviderEvent.where(external_event_id: "evt-invalid").count
      end

      test "buyer and supplier complete a sandbox protected trade through HTTP" do
        login_as(@buyer)
        post "/api/v1/business/organizations/#{@buyer_org.id}/request_for_quotes", params: {
          request_for_quote: {
            company_name: "Buyer Co", contact_name: "Buyer", email: @buyer.email, country: "Ethiopia",
            product_interest: "Bulk Coffee", product_id: @product.id, estimated_quantity: "100 kg",
            specifications: "Washed grade", incoterm: "FOB", destination_port: "Djibouti", currency: "USD",
            items: [ { product_id: @product.id, description: "Bulk Coffee", quantity: 100, unit_of_measure: "kg" } ]
          }
        }, headers: { "Idempotency-Key" => "rfq-create-1" }, as: :json
        assert_response :created
        rfq_id = JSON.parse(response.body)["id"]

        post "/api/v1/business/request_for_quotes/#{rfq_id}/publication", params: {},
             headers: { "Idempotency-Key" => "rfq-publish-1" }, as: :json
        assert_response :success

        login_as(@supplier_user)
        get "/api/v1/business/opportunities"
        assert_response :success
        invitation_id = JSON.parse(response.body).first.fetch("id")
        post "/api/v1/business/opportunities/#{invitation_id}/quotations", params: {
          currency: "USD", lead_time_days: 14, shipping_cents: 500,
          items: [ { product_id: @product.id, description: "Bulk Coffee", quantity: 100, unit_price_cents: 1_500 } ]
        }, headers: { "Idempotency-Key" => "quote-create-1" }, as: :json
        assert_response :created
        quotation_id = JSON.parse(response.body)["id"]
        post "/api/v1/business/quotations/#{quotation_id}/submission", params: {},
             headers: { "Idempotency-Key" => "quote-submit-1" }, as: :json
        assert_response :success

        login_as(@buyer)
        post "/api/v1/business/quotations/#{quotation_id}/acceptance", params: { organization_id: @buyer_org.id },
             headers: { "Idempotency-Key" => "quote-accept-1" }, as: :json
        assert_response :created
        trade_id = JSON.parse(response.body).fetch("id")
        assert JSON.parse(response.body).fetch("termsSha256").present?

        login_as(@supplier_user)
        post "/api/v1/business/trade_orders/#{trade_id}/acceptance", params: { organization_id: @supplier_org.id, role: "supplier" },
             headers: { "Idempotency-Key" => "trade-accept-1" }, as: :json
        assert_response :success

        login_as(@buyer)
        post "/api/v1/business/trade_orders/#{trade_id}/protected_payment", params: {},
             headers: { "Idempotency-Key" => "payment-intent-1" }, as: :json
        assert_response :success
        post "/api/v1/business/trade_orders/#{trade_id}/sandbox_funding", params: {},
             headers: { "Idempotency-Key" => "payment-fund-1" }, as: :json
        assert_response :success

        login_as(@supplier_user)
        post "/api/v1/business/trade_orders/#{trade_id}/shipment", params: { carrier: "DHL", tracking_number: "ET-1" },
             headers: { "Idempotency-Key" => "shipment-1" }, as: :json
        assert_response :success

        login_as(@admin)
        shipment_id = TradeOrder.find(trade_id).shipment.id
        post "/api/v1/admin/business/shipments/#{shipment_id}/delivery_verification", params: {},
             headers: { "Idempotency-Key" => "delivery-verify-1" }, as: :json
        assert_response :success

        login_as(@buyer)
        post "/api/v1/business/trade_orders/#{trade_id}/delivery_acceptance", params: { organization_id: @buyer_org.id },
             headers: { "Idempotency-Key" => "delivery-accept-1" }, as: :json
        assert_response :success

        login_as(@admin)
        post "/api/v1/admin/business/trade_orders/#{trade_id}/release", params: {},
             headers: { "Idempotency-Key" => "trade-release-1" }, as: :json
        assert_response :success
        assert_equal "completed", TradeOrder.find(trade_id).status
        assert_equal "settled", TradeOrder.find(trade_id).protected_payment.status
      end
    end
  end
end
