require "test_helper"

module Api
  module V1
    class RequestForQuotesTest < ActionDispatch::IntegrationTest
      test "creates a commercial sourcing request" do
        assert_difference -> { RequestForQuote.count }, 1 do
          post "/api/v1/request_for_quotes", params: {
            request_for_quote: {
              company_name: "Habesha Imports",
              contact_name: "Marta Bekele",
              email: "marta@example.com",
              country: "United Kingdom",
              product_interest: "Grade 1 coffee",
              estimated_quantity: "One 20ft container",
              specifications: "Washed process, export packaging"
            }
          }, as: :json
        end

        assert_response :created
        body = JSON.parse(response.body)
        assert_match(/\ARFQ-/, body["reference"])
        assert_equal "Habesha Imports", body["companyName"]
        assert_equal "new", body["status"]
      end

      test "returns useful validation errors" do
        post "/api/v1/request_for_quotes", params: {
          request_for_quote: { company_name: "", email: "bad", product_interest: "" }
        }, as: :json

        assert_response :unprocessable_entity
        body = JSON.parse(response.body)
        assert body["errors"].key?("company_name")
        assert body["errors"].key?("email")
        assert body["errors"].key?("product_interest")
      end
    end
  end
end
