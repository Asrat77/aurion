require "test_helper"

module Api
  module V1
    class ProductFiltersTest < ActionDispatch::IntegrationTest
      def setup
        @coffee = Category.create!(name: "Coffee", slug: "coffee")
        @honey = Category.create!(name: "Honey", slug: "honey")

        user = User.create!(email: "vendor@example.com", password: "password123", name: "V", role: :vendor)
        @vendor = ::Vendor.create!(user: user, store_name: "Test Vendor", status: :active)

        @cheap = Product.create!(vendor: @vendor, category: @coffee, name: "Cheap Coffee",
                                  price_cents: 500, stock: 10, status: :active,
                                  origin: "Sidamo", rating: 3.0, free_shipping: false)
        @mid = Product.create!(vendor: @vendor, category: @coffee, name: "Mid Coffee",
                                price_cents: 2_500, stock: 0, status: :active,
                                origin: "Yirgacheffe", rating: 4.6, free_shipping: true)
        @dear = Product.create!(vendor: @vendor, category: @honey, name: "Rare Honey",
                                 price_cents: 9_000, stock: 4, status: :active,
                                 origin: "Tigray", rating: nil, free_shipping: true)
        Product.create!(vendor: @vendor, category: @coffee, name: "Hidden Draft",
                        price_cents: 100, stock: 5, status: :draft, origin: "Sidamo")
      end

      def names_for(params)
        get "/api/v1/products", params: params
        assert_response :success
        JSON.parse(response.body)["products"].map { |p| p["name"] }
      end

      test "drafts are never listed" do
        refute_includes names_for({}), "Hidden Draft"
      end

      test "price range narrows the catalogue" do
        names = names_for(min_price: 1_000, max_price: 5_000)
        assert_equal [ "Mid Coffee" ], names
      end

      test "origin filter accepts several values" do
        names = names_for(origin: [ "Sidamo", "Tigray" ])
        assert_equal [ "Cheap Coffee", "Rare Honey" ].sort, names.sort
      end

      test "minimum rating excludes unrated products" do
        names = names_for(min_rating: 4)
        assert_equal [ "Mid Coffee" ], names
      end

      test "in stock excludes sold-out products" do
        names = names_for(in_stock: true)
        refute_includes names, "Mid Coffee"
        assert_includes names, "Cheap Coffee"
      end

      test "free shipping filter" do
        names = names_for(free_shipping: true)
        assert_equal [ "Mid Coffee", "Rare Honey" ].sort, names.sort
      end

      test "filters combine" do
        names = names_for(category: "coffee", free_shipping: true, min_rating: 4)
        assert_equal [ "Mid Coffee" ], names
      end

      test "search still matches name, description and origin" do
        assert_includes names_for(q: "yirgacheffe"), "Mid Coffee"
      end

      test "sorting by price" do
        assert_equal [ "Cheap Coffee", "Mid Coffee", "Rare Honey" ], names_for(sort: "price_asc")
        assert_equal [ "Rare Honey", "Mid Coffee", "Cheap Coffee" ], names_for(sort: "price_desc")
      end

      test "default sort puts rated products before unrated ones" do
        names = names_for({})
        assert_equal "Mid Coffee", names.first
        assert_equal "Rare Honey", names.last, "unrated products sort last, not first"
      end

      test "pagination reports totals" do
        get "/api/v1/products", params: { per: 2, page: 1 }
        meta = JSON.parse(response.body)["meta"]
        assert_equal 3, meta["total"]
        assert_equal 2, meta["pages"]
        assert_equal 2, JSON.parse(response.body)["products"].length
      end

      test "per page is capped" do
        get "/api/v1/products", params: { per: 5_000 }
        assert_equal 100, JSON.parse(response.body)["meta"]["per"]
      end

      test "facets describe the filterable catalogue" do
        get "/api/v1/products/facets"
        assert_response :success
        body = JSON.parse(response.body)

        assert_equal [ "Sidamo", "Tigray", "Yirgacheffe" ], body["origins"]
        assert_equal 500, body["priceRange"]["minCents"]
        assert_equal 9_000, body["priceRange"]["maxCents"]
        assert_equal 2, body["freeShippingCount"]
        assert_equal 2, body["inStockCount"]
      end
    end
  end
end
