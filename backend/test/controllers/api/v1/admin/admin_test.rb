require "test_helper"

module Api
  module V1
    module Admin
      class AdminTest < ActionDispatch::IntegrationTest
        def setup
          @category = Category.create!(name: "Coffee", slug: "coffee")

          @vendor_user = User.create!(email: "vendor@example.com", password: "password123", name: "V", role: :vendor)
          @vendor = ::Vendor.create!(user: @vendor_user, store_name: "Test Vendor", commission_rate: 0.15)
          @product = Product.create!(vendor: @vendor, category: @category, name: "Coffee", price_cents: 1000,
                                      stock: 10, status: :active)

          @buyer = User.create!(email: "buyer@example.com", password: "password123", name: "Buyer", role: :buyer)
          @admin = User.create!(email: "admin@example.com", password: "password123", name: "Admin", role: :admin)

          @order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 2000, shipping_cents: 500,
                                  tax_cents: 160, total_cents: 2660, currency: "USD", fx_rate: 1)
          @order.order_items.create!(product: @product, vendor: @vendor, product_name: @product.name,
                                      unit_price_cents: 1000, quantity: 2, line_total_cents: 2000,
                                      commission_cents: 300, net_cents: 1700)
          @order.mark_paid!
        end

        def login_as(user)
          post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
        end

        test "non-admin roles are forbidden" do
          login_as(@buyer)
          get "/api/v1/admin/overview"
          assert_response :forbidden

          login_as(@vendor_user)
          get "/api/v1/admin/overview"
          assert_response :forbidden
        end

        test "unauthenticated requests are unauthorized" do
          get "/api/v1/admin/overview"
          assert_response :unauthorized
        end

        test "overview aggregates paid orders only" do
          pending_order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 500, shipping_cents: 0,
                                         tax_cents: 0, total_cents: 500, currency: "USD", fx_rate: 1)

          login_as(@admin)
          get "/api/v1/admin/overview"
          body = JSON.parse(response.body)

          assert_equal 1, body["totalOrders"] # pending_order excluded
          assert_equal 2660, body["totalRevenueCents"]
          assert_equal 1, body["totalCustomers"]
          assert_equal 1, body["recentOrders"].length
          pending_order.destroy!
        end

        test "orders index returns all orders regardless of status" do
          Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 500, shipping_cents: 0,
                        tax_cents: 0, total_cents: 500, currency: "USD", fx_rate: 1)

          login_as(@admin)
          get "/api/v1/admin/orders"
          body = JSON.parse(response.body)
          assert_equal 2, body.length
        end

        test "customers index groups spend by buyer" do
          login_as(@admin)
          get "/api/v1/admin/customers"
          body = JSON.parse(response.body)
          assert_equal 1, body.length
          assert_equal "buyer@example.com", body.first["email"]
          assert_equal 2660, body.first["totalCents"]
        end

        test "vendors index reports revenue per vendor" do
          login_as(@admin)
          get "/api/v1/admin/vendors"
          body = JSON.parse(response.body)
          vendor_row = body.find { |v| v["storeName"] == "Test Vendor" }
          assert_equal 2000, vendor_row["revenueCents"]
          assert_equal 1, vendor_row["productCount"]
        end

        test "products index returns products regardless of status" do
          Product.create!(vendor: @vendor, category: @category, name: "Draft Item", price_cents: 100,
                           stock: 1, status: :draft)

          login_as(@admin)
          get "/api/v1/admin/products"
          names = JSON.parse(response.body).map { |p| p["name"] }
          assert_includes names, "Draft Item"
        end

        test "analytics computes average order value and top product" do
          login_as(@admin)
          get "/api/v1/admin/analytics"
          body = JSON.parse(response.body)
          assert_equal 2660, body["totalRevenueCents"]
          assert_equal 2660, body["avgOrderCents"]
          assert_equal "Coffee", body["topProductName"]
          assert_equal 2, body["topProductQty"]
        end
      end
    end
  end
end
