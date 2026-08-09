require "test_helper"

module Api
  module V1
    class AuthTest < ActionDispatch::IntegrationTest
      test "register creates a buyer and signs them in" do
        post "/api/v1/auth/register", params: {
          email: "new@example.com", password: "password123", name: "New Buyer"
        }, as: :json

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "new@example.com", body["email"]
        assert_equal "buyer", body["role"]
        assert cookies[:aurion_jwt].present?
      end

      test "register rejects duplicate email" do
        User.create!(email: "dup@example.com", password: "password123", name: "First")

        post "/api/v1/auth/register", params: {
          email: "dup@example.com", password: "password123", name: "Second"
        }, as: :json

        assert_response :unprocessable_entity
      end

      test "login succeeds with correct credentials" do
        User.create!(email: "user@example.com", password: "password123", name: "User")

        post "/api/v1/auth/login", params: { email: "user@example.com", password: "password123" }, as: :json

        assert_response :success
        assert cookies[:aurion_jwt].present?
      end

      test "login accepts an exact allowed frontend origin without a CSRF cookie" do
        User.create!(email: "rollout@example.com", password: "password123", name: "Rollout User")

        post "/api/v1/auth/login",
          params: { email: "rollout@example.com", password: "password123" },
          headers: { "Origin" => "http://localhost:3000" },
          as: :json

        assert_response :success
        assert cookies[:aurion_jwt].present?
      end

      test "login rejects an untrusted frontend origin" do
        User.create!(email: "protected@example.com", password: "password123", name: "Protected User")

        post "/api/v1/auth/login",
          params: { email: "protected@example.com", password: "password123" },
          headers: { "Origin" => "https://attacker.example" },
          as: :json

        assert_response :forbidden
        assert_equal "Request origin is not allowed.", JSON.parse(response.body)["message"]
        assert_not cookies[:aurion_jwt].present?
      end

      test "login fails with wrong password" do
        User.create!(email: "user2@example.com", password: "password123", name: "User")

        post "/api/v1/auth/login", params: { email: "user2@example.com", password: "wrong" }, as: :json

        assert_response :unauthorized
      end

      test "me requires authentication" do
        get "/api/v1/me"
        assert_response :unauthorized
      end

      test "me returns current user once logged in" do
        User.create!(email: "me@example.com", password: "password123", name: "Me")
        post "/api/v1/auth/login", params: { email: "me@example.com", password: "password123" }, as: :json

        get "/api/v1/me"
        assert_response :success
        assert_equal "me@example.com", JSON.parse(response.body)["email"]
      end

      test "logout clears the session" do
        User.create!(email: "out@example.com", password: "password123", name: "Out")
        post "/api/v1/auth/login", params: { email: "out@example.com", password: "password123" }, as: :json

        delete "/api/v1/auth/logout"
        assert_response :no_content

        get "/api/v1/me"
        assert_response :unauthorized
      end

      test "update changes profile fields" do
        User.create!(email: "profile@example.com", password: "password123", name: "Old Name")
        post "/api/v1/auth/login", params: { email: "profile@example.com", password: "password123" }, as: :json

        patch "/api/v1/me", params: { name: "New Name", phone: "+251911111111" }, as: :json

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal "New Name", body["name"]
        assert_equal "+251911111111", body["phone"]
      end

      test "destroy deletes the account and signs out" do
        User.create!(email: "delete@example.com", password: "password123", name: "Delete Me")
        post "/api/v1/auth/login", params: { email: "delete@example.com", password: "password123" }, as: :json

        delete "/api/v1/me"
        assert_response :no_content
        assert_nil User.find_by(email: "delete@example.com")

        get "/api/v1/me"
        assert_response :unauthorized
      end
    end
  end
end
