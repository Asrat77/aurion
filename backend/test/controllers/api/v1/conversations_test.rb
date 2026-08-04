require "test_helper"

module Api
  module V1
    class ConversationsTest < ActionDispatch::IntegrationTest
      def setup
        @category = Category.create!(name: "Coffee", slug: "coffee")

        @vendor_user = User.create!(email: "vendor@example.com", password: "password123",
                                     name: "Vendor One", role: :vendor)
        @vendor = ::Vendor.create!(user: @vendor_user, store_name: "Vendor One", status: :active)
        @product = Product.create!(vendor: @vendor, category: @category, name: "Coffee",
                                    price_cents: 1000, stock: 10, status: :active)

        @other_vendor_user = User.create!(email: "vendor2@example.com", password: "password123",
                                           name: "Vendor Two", role: :vendor)
        @other_vendor = ::Vendor.create!(user: @other_vendor_user, store_name: "Vendor Two",
                                          status: :active)

        @buyer = User.create!(email: "buyer@example.com", password: "password123",
                               name: "Buyer", role: :buyer)
        @other_buyer = User.create!(email: "buyer2@example.com", password: "password123",
                                     name: "Other Buyer", role: :buyer)
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
      end

      def start_thread(body: "Is this still in stock?", **params)
        post "/api/v1/conversations",
             params: { vendor_id: @vendor.id, product_id: @product.id, body: body, **params },
             as: :json
      end

      test "messaging requires authentication" do
        start_thread
        assert_response :unauthorized
      end

      test "a buyer can start a thread with a vendor" do
        login_as(@buyer)
        start_thread

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "Coffee", body["subject"]
        assert_equal "Vendor One", body["counterpartName"]
        assert_equal 1, body["messages"].length
        assert body["messages"].first["mine"]
      end

      test "an empty message is rejected" do
        login_as(@buyer)
        start_thread(body: "")

        assert_response :unprocessable_entity
        assert_equal 0, Conversation.count
      end

      test "replying to the same context reuses the thread" do
        login_as(@buyer)
        start_thread
        first_id = JSON.parse(response.body)["id"]

        start_thread(body: "Still wondering.")
        assert_equal first_id, JSON.parse(response.body)["id"]
        assert_equal 1, Conversation.count
        assert_equal 2, Conversation.find(first_id).messages.count
      end

      test "the vendor sees the thread and can reply" do
        login_as(@buyer)
        start_thread
        conversation_id = JSON.parse(response.body)["id"]

        login_as(@vendor_user)
        get "/api/v1/conversations"
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal [ conversation_id ], body["conversations"].map { |c| c["id"] }
        assert_equal 1, body["unreadTotal"]
        assert_equal "Buyer", body["conversations"].first["counterpartName"]

        post "/api/v1/conversations/#{conversation_id}/reply",
             params: { body: "Yes, plenty in stock." }, as: :json
        assert_response :created
        assert JSON.parse(response.body)["mine"]
      end

      test "opening a thread marks the other side's messages read" do
        login_as(@buyer)
        start_thread
        conversation_id = JSON.parse(response.body)["id"]

        login_as(@vendor_user)
        assert_equal 1, JSON.parse(get_index)["unreadTotal"]

        get "/api/v1/conversations/#{conversation_id}"
        assert_response :success
        assert_equal 0, JSON.parse(response.body)["unreadCount"]
        assert_equal 0, JSON.parse(get_index)["unreadTotal"]
      end

      test "reading does not mark your own messages read" do
        login_as(@buyer)
        start_thread
        conversation_id = JSON.parse(response.body)["id"]

        get "/api/v1/conversations/#{conversation_id}"
        assert_nil Conversation.find(conversation_id).messages.first.read_at,
                   "a buyer opening their own thread must not mark their own message read"
      end

      test "another buyer cannot see or reply to the thread" do
        login_as(@buyer)
        start_thread
        conversation_id = JSON.parse(response.body)["id"]

        login_as(@other_buyer)
        get "/api/v1/conversations"
        assert_empty JSON.parse(response.body)["conversations"]

        get "/api/v1/conversations/#{conversation_id}"
        assert_response :not_found

        post "/api/v1/conversations/#{conversation_id}/reply", params: { body: "Hi" }, as: :json
        assert_response :not_found
      end

      test "an unrelated vendor cannot see the thread" do
        login_as(@buyer)
        start_thread
        conversation_id = JSON.parse(response.body)["id"]

        login_as(@other_vendor_user)
        get "/api/v1/conversations"
        assert_empty JSON.parse(response.body)["conversations"]

        get "/api/v1/conversations/#{conversation_id}"
        assert_response :not_found
      end

      test "an order thread is titled by its reference and kept apart from a product thread" do
        order = Order.create!(buyer: @buyer, status: :paid, subtotal_cents: 1000, shipping_cents: 0,
                               tax_cents: 0, total_cents: 1000, currency: "USD", fx_rate: 1)

        login_as(@buyer)
        post "/api/v1/conversations",
             params: { vendor_id: @vendor.id, order_id: order.id, body: "Where is my order?" },
             as: :json

        assert_response :created
        assert_equal "Order #{order.reference}", JSON.parse(response.body)["subject"]

        start_thread
        assert_equal 2, Conversation.count, "order and product threads are separate contexts"
      end

      test "a buyer cannot attach someone else's order to a thread" do
        stranger_order = Order.create!(buyer: @other_buyer, status: :paid, subtotal_cents: 1000,
                                        shipping_cents: 0, tax_cents: 0, total_cents: 1000,
                                        currency: "USD", fx_rate: 1)

        login_as(@buyer)
        post "/api/v1/conversations",
             params: { vendor_id: @vendor.id, order_id: stranger_order.id, body: "Hello" },
             as: :json

        assert_response :created
        assert_nil Conversation.last.order_id, "another buyer's order must not be attached"
      end

      test "threads sort by most recent activity" do
        login_as(@buyer)
        start_thread
        product_thread = JSON.parse(response.body)["id"]

        post "/api/v1/conversations",
             params: { vendor_id: @other_vendor.id, body: "Do you ship to Kenya?" }, as: :json
        other_thread = JSON.parse(response.body)["id"]

        post "/api/v1/conversations/#{product_thread}/reply", params: { body: "Bump" }, as: :json

        get "/api/v1/conversations"
        ids = JSON.parse(response.body)["conversations"].map { |c| c["id"] }
        assert_equal [ product_thread, other_thread ], ids
      end

      private

      def get_index
        get "/api/v1/conversations"
        response.body
      end
    end
  end
end
