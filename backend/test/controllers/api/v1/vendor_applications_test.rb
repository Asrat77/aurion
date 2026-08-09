require "test_helper"

module Api
  module V1
    class VendorApplicationsTest < ActionDispatch::IntegrationTest
      def setup
        @applicant = User.create!(email: "applicant@example.com", password: "password123",
                                   name: "Applicant", role: :buyer)
        @admin = User.create!(email: "admin@example.com", password: "password123",
                               name: "Admin", role: :admin)
      end

      def login_as(user)
        post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
      end

      def valid_application
        {
          store_name: "Kaffa Highlands", contact_name: "Selam T.", contact_phone: "+251911000000",
          country: "ET", city: "Jimma", product_focus: "Specialty coffee",
          business_registration: "ET-0099", bio: "Third-generation growers."
        }
      end

      test "applying requires authentication" do
        post "/api/v1/vendor_application", params: valid_application, as: :json
        assert_response :unauthorized
      end

      test "a buyer can apply and stays a buyer until approved" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "pending", body["status"]
        assert_equal "Kaffa Highlands", body["storeName"]
        assert_equal "buyer", @applicant.reload.role, "role must not change before approval"
      end

      test "an application needs contact details" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: { store_name: "No Contact" }, as: :json

        assert_response :unprocessable_entity
        assert_nil @applicant.reload.vendor
      end

      test "an applicant cannot set their own commission rate" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application.merge(commission_rate: 0), as: :json

        assert_response :created
        assert_equal 0.15, @applicant.reload.vendor.commission_rate.to_f
      end

      test "applying twice is rejected" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json
        assert_response :created

        post "/api/v1/vendor_application", params: valid_application, as: :json
        assert_response :unprocessable_entity
        assert_equal 1, ::Vendor.where(user: @applicant).count
      end

      test "an applicant can check where their application stands" do
        login_as(@applicant)
        get "/api/v1/vendor_application"
        assert_response :no_content

        post "/api/v1/vendor_application", params: valid_application, as: :json
        get "/api/v1/vendor_application"

        assert_response :success
        assert_equal "pending", JSON.parse(response.body)["status"]
      end

      test "approval activates the store and grants the vendor role" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json
        vendor_id = JSON.parse(response.body)["id"]

        login_as(@admin)
        post "/api/v1/admin/vendor_applications/#{vendor_id}/approve",
             params: { note: "Verified registration" }, as: :json

        assert_response :success
        assert_equal "active", JSON.parse(response.body)["status"]
        assert_equal "vendor", @applicant.reload.role
      end

      test "an approved vendor can reach the vendor dashboard" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json
        vendor_id = JSON.parse(response.body)["id"]

        login_as(@applicant)
        get "/api/v1/vendor/overview"
        assert_response :forbidden

        login_as(@admin)
        post "/api/v1/admin/vendor_applications/#{vendor_id}/approve", as: :json

        login_as(@applicant)
        get "/api/v1/vendor/overview"
        assert_response :success
      end

      test "rejection leaves the applicant a buyer" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json
        vendor_id = JSON.parse(response.body)["id"]

        login_as(@admin)
        post "/api/v1/admin/vendor_applications/#{vendor_id}/reject",
             params: { note: "Registration could not be verified" }, as: :json

        assert_response :success
        assert_equal "rejected", JSON.parse(response.body)["status"]
        assert_equal "buyer", @applicant.reload.role
      end

      test "a decided application cannot be decided again" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json
        vendor_id = JSON.parse(response.body)["id"]

        login_as(@admin)
        post "/api/v1/admin/vendor_applications/#{vendor_id}/approve", as: :json
        assert_response :success

        post "/api/v1/admin/vendor_applications/#{vendor_id}/reject", as: :json
        assert_response :unprocessable_entity
      end

      test "buyers cannot approve their own application" do
        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json
        vendor_id = JSON.parse(response.body)["id"]

        post "/api/v1/admin/vendor_applications/#{vendor_id}/approve", as: :json
        assert_response :forbidden
        assert_equal "pending", ::Vendor.find(vendor_id).status
      end

      test "the admin queue lists applications but not seeded vendors" do
        seeded_user = User.create!(email: "seeded@example.com", password: "password123",
                                    name: "Seeded", role: :vendor)
        ::Vendor.create!(user: seeded_user, store_name: "Seeded Store", status: :active)

        login_as(@applicant)
        post "/api/v1/vendor_application", params: valid_application, as: :json

        login_as(@admin)
        get "/api/v1/admin/vendor_applications"

        assert_response :success
        names = JSON.parse(response.body).map { |v| v["storeName"] }
        assert_includes names, "Kaffa Highlands"
        refute_includes names, "Seeded Store"
      end
    end
  end
end
