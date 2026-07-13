require "test_helper"

module Api
  module V1
    class ProductsTest < ActionDispatch::IntegrationTest
      def setup
        @user = User.create!(email: "vendor1@example.com", password: "password123", name: "V1", role: :vendor)
        @vendor = ::Vendor.create!(user: @user, store_name: "Test Vendor")
        @coffee = Category.create!(name: "Coffee", slug: "coffee")
        @tea = Category.create!(name: "Tea", slug: "tea")

        @p1 = Product.create!(vendor: @vendor, category: @coffee, name: "Yirgacheffe", price_cents: 2000,
                               stock: 10, rating: 4.8, status: :active, origin: "Ethiopia")
        @p2 = Product.create!(vendor: @vendor, category: @coffee, name: "Sidamo", price_cents: 1000,
                               stock: 10, rating: 4.2, status: :active, origin: "Ethiopia")
        @p3 = Product.create!(vendor: @vendor, category: @tea, name: "Green Tea", price_cents: 500,
                               stock: 10, rating: 4.9, status: :active, origin: "China")
        @draft = Product.create!(vendor: @vendor, category: @tea, name: "Unreleased Blend", price_cents: 500,
                                  stock: 10, status: :draft)
      end

      test "index only returns active products" do
        get "/api/v1/products"
        body = JSON.parse(response.body)
        names = body["products"].map { |p| p["name"] }
        assert_includes names, "Yirgacheffe"
        refute_includes names, "Unreleased Blend"
      end

      test "index filters by category slug" do
        get "/api/v1/products", params: { category: "coffee" }
        body = JSON.parse(response.body)
        names = body["products"].map { |p| p["name"] }
        assert_equal %w[Yirgacheffe Sidamo].sort, names.sort
      end

      test "index searches name and origin" do
        get "/api/v1/products", params: { q: "china" }
        body = JSON.parse(response.body)
        assert_equal [ "Green Tea" ], body["products"].map { |p| p["name"] }
      end

      test "index sorts by price ascending" do
        get "/api/v1/products", params: { sort: "price_asc" }
        body = JSON.parse(response.body)
        prices = body["products"].map { |p| p["priceCents"] }
        assert_equal prices.sort, prices
      end

      test "index sorts by rating (popular) by default" do
        get "/api/v1/products"
        body = JSON.parse(response.body)
        names = body["products"].map { |p| p["name"] }
        assert_equal "Green Tea", names.first # highest rating 4.9
      end

      test "show returns product by slug" do
        get "/api/v1/products/#{@p1.slug}"
        assert_response :success
        assert_equal "Yirgacheffe", JSON.parse(response.body)["name"]
      end

      test "show 404s for draft product" do
        get "/api/v1/products/#{@draft.slug}"
        assert_response :not_found
      end
    end
  end
end
