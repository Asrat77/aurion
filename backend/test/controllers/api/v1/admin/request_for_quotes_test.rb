require "test_helper"

module Api
  module V1
    module Admin
      class RequestForQuotesTest < ActionDispatch::IntegrationTest
        def setup
          @buyer = User.create!(email: "buyer-rfq@example.com", password: "password123", name: "Buyer", role: :buyer)
          @admin = User.create!(email: "admin-rfq@example.com", password: "password123", name: "Admin", role: :admin)
          @request_for_quote = RequestForQuote.create!(
            company_name: "Habesha Imports",
            email: "marta@example.com",
            product_interest: "White teff",
          )
        end

        test "requires an admin" do
          get "/api/v1/admin/request_for_quotes"
          assert_response :unauthorized

          login_as(@buyer)
          get "/api/v1/admin/request_for_quotes"
          assert_response :forbidden
        end

        test "lists the newest requests first" do
          newer = RequestForQuote.create!(
            company_name: "Abyssinia Foods",
            email: "buyer@abyssinia.example",
            product_interest: "Berbere",
          )

          login_as(@admin)
          get "/api/v1/admin/request_for_quotes"

          assert_response :success
          body = JSON.parse(response.body)
          assert_equal newer.reference, body.first["reference"]
          assert_equal @request_for_quote.reference, body.second["reference"]
        end

        private
          def login_as(user)
            post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
          end
      end
    end
  end
end
