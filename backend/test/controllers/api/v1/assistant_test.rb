require "test_helper"

module Api
  module V1
    # The assistant's boundary matters more than its prose: it must be off when
    # no provider is configured, it must never answer from a simulated model,
    # and every turn must be recorded.
    class AssistantTest < ActionDispatch::IntegrationTest
      def setup
        @previous = ENV.to_hash.slice("AI_ASSISTANT_PROVIDER", "AI_ASSISTANT_MODEL", "OPENAI_API_KEY")
        %w[AI_ASSISTANT_PROVIDER AI_ASSISTANT_MODEL OPENAI_API_KEY].each { |key| ENV.delete(key) }

        @category = Category.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(4)}")
        @user = User.create!(email: "shopper-#{SecureRandom.hex(4)}@example.com", password: "password123",
                             name: "Shopper", role: :buyer)
        supplier = User.create!(email: "seller-#{SecureRandom.hex(4)}@example.com", password: "password123",
                                name: "Seller", role: :vendor)
        @vendor = ::Vendor.create!(user: supplier, store_name: "Highland Roasters", status: :active)
        @product = Product.create!(vendor: @vendor, category: @category, name: "Yirgacheffe Single Origin",
                                   description: "Washed Yirgacheffe green coffee.", price_cents: 3_400,
                                   stock: 40, status: :active, express_enabled: true)
      end

      def teardown
        %w[AI_ASSISTANT_PROVIDER AI_ASSISTANT_MODEL OPENAI_API_KEY].each { |key| ENV.delete(key) }
        @previous.each { |key, value| ENV[key] = value }
      end

      test "status reports the assistant as off when no provider is configured" do
        get "/api/v1/assistant"
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal false, body.fetch("enabled")
        assert_nil body.fetch("model")
        assert body.fetch("reason").present?
      end

      test "asking with no provider configured fails closed instead of answering" do
        post "/api/v1/assistant/messages", params: { question: "Do you sell coffee?", channel: "express" }, as: :json
        assert_response :service_unavailable
        assert_equal false, JSON.parse(response.body).fetch("enabled")
        # Nothing may be recorded as an answer when no model ran.
        assert_equal 0, AssistantExchange.count
      end

      test "a selected provider without credentials is still off" do
        ENV["AI_ASSISTANT_PROVIDER"] = "openai"

        get "/api/v1/assistant"
        assert_equal false, JSON.parse(response.body).fetch("enabled")

        post "/api/v1/assistant/messages", params: { question: "Do you sell coffee?" }, as: :json
        assert_response :service_unavailable
        assert_equal 0, AssistantExchange.count
      end

      test "a blank question is rejected before any provider call" do
        ENV["AI_ASSISTANT_PROVIDER"] = "openai"
        ENV["OPENAI_API_KEY"] = "test-key"

        post "/api/v1/assistant/messages", params: { question: "   " }, as: :json
        assert_response :unprocessable_entity
        assert_equal 0, AssistantExchange.count
      end

      test "a provider failure is reported as a failure and recorded, never as an answer" do
        # A configured provider pointed at a dead endpoint: enabled, so the
        # request gets as far as the model call, which then fails for real.
        ENV["AI_ASSISTANT_PROVIDER"] = "ollama"
        ENV["OLLAMA_API_BASE"] = "http://127.0.0.1:1"

        post "/api/v1/assistant/messages", params: { question: "Do you sell coffee?" }, as: :json

        assert_response :bad_gateway
        assert_nil JSON.parse(response.body)["answer"]
        # The turn is still on the record, marked as failed rather than answered.
        exchange = AssistantExchange.last
        assert_equal "failed", exchange.status
        assert_nil exchange.answer
      ensure
        ENV.delete("OLLAMA_API_BASE")
      end

      test "the context is grounded on real catalogue rows and the asker's own orders only" do
        other = User.create!(email: "other-#{SecureRandom.hex(4)}@example.com", password: "password123",
                             name: "Other", role: :buyer)
        context = AiAssistant::Context.new(task: "express_support", question: "yirgacheffe coffee", user: other).build

        assert_includes context[:text], "Yirgacheffe Single Origin"
        assert_includes context[:text], "Highland Roasters"
        # The other shopper has no orders, so no order section is emitted.
        assert_not context[:summary].key?("orders")
      end

      test "an answered turn is recorded with its provider, grounding and latency" do
        ENV["AI_ASSISTANT_PROVIDER"] = "openai"
        ENV["OPENAI_API_KEY"] = "test-key"

        reply = Struct.new(:content, :input_tokens, :output_tokens)
                      .new("We stock Yirgacheffe Single Origin.", 120, 30)
        captured_instructions = nil
        factory = lambda do |instructions|
          captured_instructions = instructions
          chat = Object.new
          chat.define_singleton_method(:ask) { |_| reply }
          chat
        end

        exchange = AiAssistant::Responder.new(
          task: "express_support", question: "Do you sell Yirgacheffe?", channel: "express",
          conversation_key: "conv-1", user: @user, chat_factory: factory
        ).call

        assert_equal "answered", exchange.status
        assert_equal "We stock Yirgacheffe Single Origin.", exchange.answer
        assert_equal "openai", exchange.provider
        assert_equal 120, exchange.input_tokens
        assert exchange.latency_ms >= 0
        assert exchange.grounding.key?("products")

        # The model is handed the real catalogue row and told not to invent.
        assert_includes captured_instructions, "Yirgacheffe Single Origin"
        assert_includes captured_instructions, "Answer only from the AURION records"
      end

      test "a signed-in user is rate limited once the hourly cap is reached" do
        ENV["AI_ASSISTANT_PROVIDER"] = "openai"
        ENV["OPENAI_API_KEY"] = "test-key"
        ENV["AI_ASSISTANT_HOURLY_LIMIT"] = "1"

        AssistantExchange.create!(user: @user, conversation_key: "conv-x", channel: "express",
                                  task: "express_support", provider: "openai", model: "gpt-4o-mini",
                                  status: "answered", question: "earlier question")

        error = assert_raises(AiAssistant::Responder::RateLimited) do
          AiAssistant::Responder.new(task: "express_support", question: "another", channel: "express",
                                     conversation_key: "conv-y", user: @user).call
        end
        assert_match(/Too many/, error.message)
      ensure
        ENV.delete("AI_ASSISTANT_HOURLY_LIMIT")
      end
    end
  end
end
