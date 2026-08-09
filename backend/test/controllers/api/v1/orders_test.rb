require "test_helper"

module Api
  module V1
    class OrdersTest < ActionDispatch::IntegrationTest
      def setup
        @vendor_user = User.create!(email: "vendor@example.com", password: "password123", name: "V", role: :vendor)
        @vendor = ::Vendor.create!(user: @vendor_user, store_name: "Test Vendor", commission_rate: 0.15)
        @category = Category.create!(name: "Coffee", slug: "coffee")
        @product = Product.create!(vendor: @vendor, category: @category, name: "Coffee", price_cents: 1000,
                                    stock: 5, status: :active)

        @buyer = User.create!(email: "buyer@example.com", password: "password123", name: "Buyer", role: :buyer)
        post "/api/v1/auth/login", params: { email: "buyer@example.com", password: "password123" }, as: :json
      end

      test "create requires authentication" do
        reset!
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 1 } ] }, as: :json
        assert_response :unauthorized
      end

      test "create rejects empty cart" do
        post "/api/v1/orders", params: { items: [] }, as: :json
        assert_response :unprocessable_entity
      end

      test "create computes subtotal, shipping, tax, commission, and net from DB prices" do
        post "/api/v1/orders", params: {
          items: [ { product_id: @product.id, quantity: 2 } ],
          country: "US",
          shipping_address: { first: "A", last: "B", email: "a@b.com", address: "St", city: "C", country: "US" }
        }, as: :json

        assert_response :created
        body = JSON.parse(response.body)

        assert_equal 2000, body["subtotalCents"]
        assert_equal 1800, body["shippingCents"] # international zone
        assert_equal 0, body["taxCents"] # exports are zero-rated
        assert_equal 3800, body["totalCents"]
        assert_equal "USD", body["currency"]
        assert_equal "pending", body["status"]

        item = body["items"].first
        assert_equal 2000, item["lineTotalCents"]
        assert_equal 300, item["commissionCents"] # 15% of 2000
        assert_equal 1700, item["netCents"]
      end

      test "create ignores client-supplied price and uses DB price" do
        post "/api/v1/orders", params: {
          items: [ { product_id: @product.id, quantity: 1, price_cents: 1 } ]
        }, as: :json

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 1000, body["subtotalCents"] # DB price (1000), not the tampered 1
      end

      test "create decrements product stock" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 3 } ] }, as: :json
        assert_response :created
        assert_equal 2, @product.reload.stock
      end

      test "create rejects when stock is insufficient" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 999 } ] }, as: :json
        assert_response :unprocessable_entity
        assert_equal 5, @product.reload.stock # untouched
      end

      test "create uses ETB currency, domestic shipping and Ethiopian VAT for Ethiopia" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 1 } ], country: "ET" }, as: :json
        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "ETB", body["currency"]
        assert_equal 140.0, body["fxRate"]
        assert_equal 400, body["shippingCents"] # domestic zone
        assert_equal 150, body["taxCents"] # 15% VAT on 1000
        assert_equal 1550, body["totalCents"]
      end

      test "amounts stay in base currency so a live gateway converts once" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 1 } ], country: "ET" }, as: :json
        order = Order.find(JSON.parse(response.body)["id"])

        # 1550 base cents at 140 birr/USD is what Chapa would actually charge.
        assert_equal 1550, order.total_cents
        assert_equal 217_000, order.charge_amount_cents
      end

      test "quote prices a cart without creating an order" do
        assert_no_difference -> { Order.count } do
          post "/api/v1/orders/quote", params: {
            items: [ { product_id: @product.id, quantity: 1 } ], country: "ET"
          }, as: :json
        end

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1000, body["subtotalCents"]
        assert_equal 400, body["shippingCents"]
        assert_equal 150, body["taxCents"]
        assert_equal "ETB", body["currency"]
        assert_equal "VAT (15%)", body["taxLabel"]
        assert_equal 5, @product.reload.stock, "quoting must not touch stock"
      end

      test "quote matches what create then charges" do
        post "/api/v1/orders/quote", params: {
          items: [ { product_id: @product.id, quantity: 2 } ], country: "KE"
        }, as: :json
        quoted = JSON.parse(response.body)

        post "/api/v1/orders", params: {
          items: [ { product_id: @product.id, quantity: 2 } ], country: "KE"
        }, as: :json
        created = JSON.parse(response.body)

        assert_equal quoted["totalCents"], created["totalCents"]
        assert_equal quoted["shippingCents"], created["shippingCents"]
        assert_equal 1200, created["shippingCents"] # regional zone
      end

      test "buyer can cancel their own unpaid order and stock returns" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 2 } ] }, as: :json
        order_id = JSON.parse(response.body)["id"]
        assert_equal 3, @product.reload.stock

        post "/api/v1/orders/#{order_id}/cancel"
        assert_response :success
        assert_equal "cancelled", JSON.parse(response.body)["status"]
        assert_equal 5, @product.reload.stock
      end

      test "buyer cannot cancel another buyer's order" do
        other = User.create!(email: "other2@example.com", password: "password123", name: "Other", role: :buyer)
        order = Order.create!(buyer: other, status: :pending, subtotal_cents: 100, shipping_cents: 0,
                               tax_cents: 0, total_cents: 100, currency: "USD", fx_rate: 1)

        post "/api/v1/orders/#{order.id}/cancel"
        assert_response :not_found
        assert_equal "pending", order.reload.status
      end

      test "free shipping applies above the threshold" do
        post "/api/v1/orders/quote", params: {
          items: [ { product_id: @product.id, quantity: 200 } ], country: "US"
        }, as: :json

        body = JSON.parse(response.body)
        assert_equal 200_000, body["subtotalCents"]
        assert_equal 0, body["shippingCents"]
        assert body["freeShippingApplied"]
      end

      test "index only returns the current buyer's orders" do
        other_buyer = User.create!(email: "other@example.com", password: "password123", name: "Other", role: :buyer)
        order = Order.create!(buyer: other_buyer, status: :pending, subtotal_cents: 100, shipping_cents: 0,
                               tax_cents: 0, total_cents: 100, currency: "USD", fx_rate: 1)

        get "/api/v1/orders"
        ids = JSON.parse(response.body).map { |o| o["id"] }
        refute_includes ids, order.id
      end

      test "mock payment confirmation marks order paid and creates payouts" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 2 } ] }, as: :json
        order_id = JSON.parse(response.body)["id"]

        post "/api/v1/payments/#{order_id}/mock_confirm"
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal "paid", body["status"]

        order = Order.find(order_id)
        assert order.paid_at.present?
        assert_equal 1, order.order_items.count
        payout = Payout.find_by(order_item: order.order_items.first)
        assert_equal order.order_items.first.net_cents, payout.amount_cents
      end

      test "mock payment confirmation is idempotent" do
        post "/api/v1/orders", params: { items: [ { product_id: @product.id, quantity: 1 } ] }, as: :json
        order_id = JSON.parse(response.body)["id"]

        post "/api/v1/payments/#{order_id}/mock_confirm"
        post "/api/v1/payments/#{order_id}/mock_confirm"

        assert_response :success
        assert_equal 1, Payout.where(order_item: Order.find(order_id).order_items).count
      end
    end
  end
end
