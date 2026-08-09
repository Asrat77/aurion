require "test_helper"

module Api
  module V1
    class RefundRequestsTest < ActionDispatch::IntegrationTest
      def setup
        @category = Category.create!(name: "Coffee", slug: "coffee")
        @vendor_user = User.create!(email: "vendor@example.com", password: "password123", name: "V", role: :vendor)
        @vendor = ::Vendor.create!(user: @vendor_user, store_name: "Test Vendor", commission_rate: 0.15)
        @product = Product.create!(vendor: @vendor, category: @category, name: "Coffee",
                                    price_cents: 1000, stock: 10, status: :active)

        @buyer = User.create!(email: "buyer@example.com", password: "password123", name: "Buyer", role: :buyer)
        @admin = User.create!(email: "admin@example.com", password: "password123", name: "Admin", role: :admin)

        @order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 2000, shipping_cents: 0,
                                tax_cents: 0, total_cents: 2000, currency: "USD", fx_rate: 1)
        @item = @order.order_items.create!(product: @product, vendor: @vendor, product_name: @product.name,
                                            unit_price_cents: 1000, quantity: 2, line_total_cents: 2000,
                                            commission_cents: 300, net_cents: 1700)
        @order.mark_paid!
        @product.decrement!(:stock, 2)
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
      end

      def ship!
        @order.advance_item!(@item, :processing, actor: @vendor_user)
        @order.advance_item!(@item, :shipped, actor: @vendor_user)
      end

      test "a buyer can claim for goods that never arrived" do
        ship!
        login_as(@buyer)

        post "/api/v1/refund_requests", params: {
          order_item_id: @item.id, reason: "not_received", detail: "Never showed up."
        }, as: :json

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "open", body["status"]
        assert_equal 2000, body["amountCents"], "the claim covers the full line total"
      end

      test "a buyer cannot claim against another buyer's order" do
        ship!
        other = User.create!(email: "other@example.com", password: "password123", name: "Other", role: :buyer)
        login_as(other)

        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        assert_response :not_found
        assert_equal 0, RefundRequest.count
      end

      test "only one open claim is allowed per line" do
        ship!
        login_as(@buyer)

        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        assert_response :created

        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "wrong_item" }, as: :json
        assert_response :unprocessable_entity
        assert_equal 1, RefundRequest.count
      end

      test "approving a claim reverses the vendor payout and restocks" do
        ship!
        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        claim_id = JSON.parse(response.body)["id"]

        assert_equal 1, Payout.where(order_item: @item).count
        assert_equal 8, @product.reload.stock

        login_as(@admin)
        post "/api/v1/admin/refund_requests/#{claim_id}/approve", params: { note: "Photos confirm damage" }, as: :json
        assert_response :success

        assert_equal "approved", JSON.parse(response.body)["status"]
        assert_equal 0, Payout.where(order_item: @item).count, "vendor must not be paid for a refunded line"
        assert_equal 10, @product.reload.stock
        assert_equal "refunded", @order.reload.status, "a fully refunded order is refunded"
      end

      test "rejecting a claim leaves the payout intact" do
        ship!
        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "other" }, as: :json
        claim_id = JSON.parse(response.body)["id"]

        login_as(@admin)
        post "/api/v1/admin/refund_requests/#{claim_id}/reject", params: { note: "Delivery confirmed" }, as: :json
        assert_response :success

        assert_equal "rejected", JSON.parse(response.body)["status"]
        assert_equal 1, Payout.where(order_item: @item).count
        assert_equal 8, @product.reload.stock
      end

      test "a resolved claim cannot be resolved again" do
        ship!
        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        claim_id = JSON.parse(response.body)["id"]

        login_as(@admin)
        post "/api/v1/admin/refund_requests/#{claim_id}/approve", as: :json
        assert_response :success

        post "/api/v1/admin/refund_requests/#{claim_id}/reject", as: :json
        assert_response :unprocessable_entity
      end

      test "buyers cannot resolve their own claims" do
        ship!
        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        claim_id = JSON.parse(response.body)["id"]

        post "/api/v1/admin/refund_requests/#{claim_id}/approve", as: :json
        assert_response :forbidden
        assert_equal "open", RefundRequest.find(claim_id).status
      end

      test "a claim cannot be raised on an unpaid order" do
        pending_order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 1000, shipping_cents: 0,
                                       tax_cents: 0, total_cents: 1000, currency: "USD", fx_rate: 1)
        item = pending_order.order_items.create!(product: @product, vendor: @vendor, product_name: @product.name,
                                                  unit_price_cents: 1000, quantity: 1, line_total_cents: 1000,
                                                  commission_cents: 150, net_cents: 850)

        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: item.id, reason: "damaged" }, as: :json
        assert_response :unprocessable_entity
      end

      test "a claim expires once the window since delivery has passed" do
        ship!
        @order.advance_item!(@item, :delivered, actor: @vendor_user)
        @item.update!(delivered_at: 31.days.ago)

        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        assert_response :unprocessable_entity
        assert_match(/no longer eligible/, JSON.parse(response.body)["message"])
      end

      test "a partial refund leaves the rest of the order running" do
        second_vendor_user = User.create!(email: "v2@example.com", password: "password123", name: "V2", role: :vendor)
        second_vendor = ::Vendor.create!(user: second_vendor_user, store_name: "Vendor Two", commission_rate: 0.15)
        second_product = Product.create!(vendor: second_vendor, category: @category, name: "Honey",
                                          price_cents: 500, stock: 5, status: :active)
        second_item = @order.order_items.create!(product: second_product, vendor: second_vendor,
                                                  product_name: second_product.name, unit_price_cents: 500,
                                                  quantity: 1, line_total_cents: 500, commission_cents: 75,
                                                  net_cents: 425)
        @order.mark_paid!

        ship!
        login_as(@buyer)
        post "/api/v1/refund_requests", params: { order_item_id: @item.id, reason: "damaged" }, as: :json
        claim_id = JSON.parse(response.body)["id"]

        login_as(@admin)
        post "/api/v1/admin/refund_requests/#{claim_id}/approve", as: :json
        assert_response :success

        refute_equal "refunded", @order.reload.status
        assert_equal "awaiting", second_item.reload.fulfillment_status
      end
    end
  end
end
