module AiAssistant
  # Which model answers, and whether one is available at all.
  #
  # The contractor's package shipped nine hard-wired provider classes and fell
  # back to a simulated answer when none was reachable, which made fabricated
  # output indistinguishable from a real one. Here the provider is a single
  # environment choice, and an unconfigured deployment is simply off: there is
  # no simulated mode and no fallback text.
  class Configuration
    # Provider name mapped to the environment variable holding its key and the
    # model used when AI_ASSISTANT_MODEL is not set.
    PROVIDERS = {
      "openai" => { key: "OPENAI_API_KEY", default_model: "gpt-4o-mini" },
      "anthropic" => { key: "ANTHROPIC_API_KEY", default_model: "claude-haiku-4-5-20251001" },
      "gemini" => { key: "GEMINI_API_KEY", default_model: "gemini-2.0-flash" },
      "mistral" => { key: "MISTRAL_API_KEY", default_model: "mistral-small-latest" },
      "deepseek" => { key: "DEEPSEEK_API_KEY", default_model: "deepseek-chat" },
      "perplexity" => { key: "PERPLEXITY_API_KEY", default_model: "sonar" },
      "xai" => { key: "XAI_API_KEY", default_model: "grok-3-mini" },
      # One key, many upstream models, including the Llama family.
      "openrouter" => { key: "OPENROUTER_API_KEY", default_model: "meta-llama/llama-3.3-70b-instruct" },
      # Self-hosted: reachable without a key, addressed by OLLAMA_API_BASE.
      "ollama" => { key: nil, default_model: "llama3.2" }
    }.freeze

    class << self
      def provider
        name = ENV["AI_ASSISTANT_PROVIDER"].to_s.downcase.presence
        PROVIDERS.key?(name) ? name : nil
      end

      def model
        return nil unless provider

        ENV["AI_ASSISTANT_MODEL"].presence || PROVIDERS.fetch(provider)[:default_model]
      end

      def api_key
        key_name = provider && PROVIDERS.fetch(provider)[:key]
        key_name && ENV[key_name].presence
      end

      def enabled?
        return false unless provider

        # Ollama is addressed by base URL rather than a key.
        provider == "ollama" ? ENV["OLLAMA_API_BASE"].present? : api_key.present?
      end

      # Cap per user per hour. A conversational endpoint backed by a metered
      # provider needs a ceiling that does not depend on the client behaving.
      def hourly_message_limit
        Integer(ENV.fetch("AI_ASSISTANT_HOURLY_LIMIT", "40"))
      end

      def status
        {
          enabled: enabled?,
          provider: provider,
          model: enabled? ? model : nil,
          reason: enabled? ? nil : disabled_reason
        }
      end

      def disabled_reason
        return "No AI provider is configured for this deployment." if provider.nil?

        "The #{provider} provider is selected but its credentials are not configured."
      end

      # RubyLLM keeps provider credentials in one global config object.
      def apply!
        return false unless enabled?

        RubyLLM.configure do |config|
          case provider
          when "openai" then config.openai_api_key = api_key
          when "anthropic" then config.anthropic_api_key = api_key
          when "gemini" then config.gemini_api_key = api_key
          when "mistral" then config.mistral_api_key = api_key
          when "deepseek" then config.deepseek_api_key = api_key
          when "perplexity" then config.perplexity_api_key = api_key
          when "xai" then config.xai_api_key = api_key
          when "openrouter" then config.openrouter_api_key = api_key
          when "ollama" then config.ollama_api_base = ENV.fetch("OLLAMA_API_BASE")
          end
          config.request_timeout = Integer(ENV.fetch("AI_ASSISTANT_TIMEOUT", "30"))
        end
        true
      end
    end
  end
end
