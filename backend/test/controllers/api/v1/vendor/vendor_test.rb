require "test_helper"

module Api
  module V1
    module Vendor
      class VendorTest < ActionDispatch::IntegrationTest
        def setup
          @category = Category.create!(name: "Coffee", slug: "coffee")

          @user_a = User.create!(email: "vendor.a@example.com", password: "password123", name: "A", role: :vendor)
          @vendor_a = ::Vendor.create!(user: @user_a, store_name: "Vendor A", commission_rate: 0.15)
          @product_a = Product.create!(vendor: @vendor_a, category: @category, name: "A Product",
                                        price_cents: 1000, stock: 10, status: :active)

          @user_b = User.create!(email: "vendor.b@example.com", password: "password123", name: "B", role: :vendor)
          @vendor_b = ::Vendor.create!(user: @user_b, store_name: "Vendor B", commission_rate: 0.15)
          @product_b = Product.create!(vendor: @vendor_b, category: @category, name: "B Product",
                                        price_cents: 2000, stock: 10, status: :active)

          @buyer = User.create!(email: "buyer@example.com", password: "password123", name: "Buyer", role: :buyer)
        end

        def login_as(user)
          post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
        end

        test "non-vendor roles are forbidden" do
          login_as(@buyer)
          get "/api/v1/vendor/overview"
          assert_response :forbidden
        end

        test "unauthenticated requests are unauthorized" do
          get "/api/v1/vendor/overview"
          assert_response :unauthorized
        end

        test "products index only returns the current vendor's products" do
          login_as(@user_a)
          get "/api/v1/vendor/products"
          names = JSON.parse(response.body).map { |p| p["name"] }
          assert_includes names, "A Product"
          refute_includes names, "B Product"
        end

        test "vendor cannot update another vendor's product" do
          login_as(@user_a)
          patch "/api/v1/vendor/products/#{@product_b.id}", params: { name: "Hijacked" }, as: :json
          assert_response :not_found
          assert_equal "B Product", @product_b.reload.name
        end

        test "vendor cannot destroy another vendor's product" do
          login_as(@user_a)
          delete "/api/v1/vendor/products/#{@product_b.id}"
          assert_response :not_found
          assert Product.exists?(@product_b.id)
        end

        test "vendor can create a product scoped to themselves" do
          login_as(@user_a)
          post "/api/v1/vendor/products", params: {
            name: "New Product", category_id: @category.id, price_cents: 500, stock: 20, emoji: "☕",
          }, as: :json
          assert_response :created
          product = Product.find_by(name: "New Product")
          assert_equal @vendor_a.id, product.vendor_id
          assert product.active?, "new vendor products should default to active, not draft"
        end

        test "overview reports only this vendor's sales" do
          buyer_order = Order.create!(buyer: @buyer, status: :paid, subtotal_cents: 1000, shipping_cents: 500,
                                       tax_cents: 80, total_cents: 1580, currency: "USD", fx_rate: 1, paid_at: Time.current)
          buyer_order.order_items.create!(product: @product_a, vendor: @vendor_a, product_name: @product_a.name,
                                           unit_price_cents: 1000, quantity: 1, line_total_cents: 1000,
                                           commission_cents: 150, net_cents: 850)

          login_as(@user_a)
          get "/api/v1/vendor/overview"
          body = JSON.parse(response.body)
          assert_equal 1000, body["grossCents"]
          assert_equal 850, body["netCents"]

          login_as(@user_b)
          get "/api/v1/vendor/overview"
          body = JSON.parse(response.body)
          assert_equal 0, body["grossCents"]
        end

        test "payouts index only shows the current vendor's payouts" do
          order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 1000, shipping_cents: 500,
                                 tax_cents: 80, total_cents: 1580, currency: "USD", fx_rate: 1)
          item = order.order_items.create!(product: @product_a, vendor: @vendor_a, product_name: @product_a.name,
                                            unit_price_cents: 1000, quantity: 1, line_total_cents: 1000,
                                            commission_cents: 150, net_cents: 850)
          order.mark_paid!

          login_as(@user_a)
          get "/api/v1/vendor/payouts"
          body = JSON.parse(response.body)
          assert_equal 1, body["payouts"].length
          assert_equal 850, body["payouts"].first["amountCents"]

          login_as(@user_b)
          get "/api/v1/vendor/payouts"
          body = JSON.parse(response.body)
          assert_equal 0, body["payouts"].length
        end
      end
    end
  end
end
