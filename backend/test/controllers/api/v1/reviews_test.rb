require "test_helper"

module Api
  module V1
    class ReviewsTest < ActionDispatch::IntegrationTest
      def setup
        @category = Category.create!(name: "Coffee", slug: "coffee")
        @vendor_user = User.create!(email: "vendor@example.com", password: "password123", name: "V", role: :vendor)
        @vendor = ::Vendor.create!(user: @vendor_user, store_name: "Test Vendor", commission_rate: 0.15)
        @product = Product.create!(vendor: @vendor, category: @category, name: "Coffee",
                                    price_cents: 1000, stock: 10, status: :active)

        @buyer = User.create!(email: "buyer@example.com", password: "password123", name: "Selam Tesfaye", role: :buyer)
        @order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 1000, shipping_cents: 0,
                                tax_cents: 0, total_cents: 1000, currency: "USD", fx_rate: 1)
        @item = @order.order_items.create!(product: @product, vendor: @vendor, product_name: @product.name,
                                            unit_price_cents: 1000, quantity: 1, line_total_cents: 1000,
                                            commission_cents: 150, net_cents: 850)
        @order.mark_paid!
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
      end

      def deliver_item!
        @order.advance_item!(@item, :processing, actor: @vendor_user)
        @order.advance_item!(@item, :shipped, actor: @vendor_user)
        @order.advance_item!(@item, :delivered, actor: @vendor_user)
      end

      test "a buyer cannot review before delivery" do
        login_as(@buyer)
        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 5, body: "Great" }, as: :json

        assert_response :unprocessable_entity
        assert_match(/delivered/, JSON.parse(response.body)["message"])
        assert_equal 0, Review.count
      end

      test "a buyer can review a delivered purchase and the product rating updates" do
        deliver_item!
        login_as(@buyer)

        post "/api/v1/reviews", params: {
          order_item_id: @item.id, rating: 4, title: "Good", body: "Rich and floral."
        }, as: :json

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 4, body["rating"]
        assert_equal "Selam", body["authorName"], "only the first name should be public"

        @product.reload
        assert_equal 4.0, @product.rating.to_f
        assert_equal 1, @product.reviews_count
      end

      test "a buyer cannot review the same purchase twice" do
        deliver_item!
        login_as(@buyer)

        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 5 }, as: :json
        assert_response :created

        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 1 }, as: :json
        assert_response :unprocessable_entity
        assert_equal 1, Review.count
      end

      test "a buyer cannot review someone else's purchase" do
        deliver_item!
        other = User.create!(email: "other@example.com", password: "password123", name: "Other", role: :buyer)
        login_as(other)

        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 5 }, as: :json
        assert_response :not_found
        assert_equal 0, Review.count
      end

      test "rating must be between 1 and 5" do
        deliver_item!
        login_as(@buyer)

        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 9 }, as: :json
        assert_response :unprocessable_entity
        assert_equal 0, Review.count
      end

      test "product reviews are public and summarised" do
        deliver_item!
        login_as(@buyer)
        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 5, body: "Superb" }, as: :json

        reset!
        get "/api/v1/products/#{@product.slug}/reviews"
        assert_response :success
        body = JSON.parse(response.body)

        assert_equal 1, body["reviews"].length
        assert_equal 5.0, body["summary"]["average"]
        assert_equal 1, body["summary"]["total"]
        assert_equal 1, body["summary"]["distribution"]["5"]
      end

      test "pending lists delivered purchases not yet reviewed" do
        deliver_item!
        login_as(@buyer)

        get "/api/v1/reviews/pending"
        assert_response :success
        assert_equal [ @item.id ], JSON.parse(response.body).map { |r| r["orderItemId"] }

        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 5 }, as: :json

        get "/api/v1/reviews/pending"
        assert_empty JSON.parse(response.body)
      end

      test "hiding a review removes it from the product's public rating" do
        deliver_item!
        login_as(@buyer)
        post "/api/v1/reviews", params: { order_item_id: @item.id, rating: 5 }, as: :json
        review_id = JSON.parse(response.body)["id"]
        assert_equal 1, @product.reload.reviews_count

        admin = User.create!(email: "admin@example.com", password: "password123", name: "Admin", role: :admin)
        login_as(admin)
        patch "/api/v1/admin/reviews/#{review_id}", params: { status: "hidden" }, as: :json
        assert_response :success

        @product.reload
        assert_equal 0, @product.reviews_count
        assert_nil @product.rating

        reset!
        get "/api/v1/products/#{@product.slug}/reviews"
        assert_empty JSON.parse(response.body)["reviews"]
      end
    end
  end
end
