module ProtectedPayments
  class Provider
    def self.for(trade_order)
      case ENV.fetch("PROTECTED_PAYMENT_PROVIDER", "disabled")
      when "sandbox"
        SandboxProvider.new(trade_order)
      else
        DisabledProvider.new(trade_order)
      end
    end

    def self.sandbox_allowed?
      !Rails.env.production?
    end

    # Adapters for licensed providers register here. It is deliberately empty:
    # until a provider account exists, nothing in the product may report itself
    # as holding real money.
    LIVE_ADAPTERS = {}.freeze

    def self.mode
      configured = ENV.fetch("PROTECTED_PAYMENT_PROVIDER", "disabled")
      return "sandbox" if configured == "sandbox" && sandbox_allowed?
      return "live" if LIVE_ADAPTERS.key?(configured)

      "disabled"
    end

    # Copy shown wherever protection is mentioned, so the storefront claim and
    # the deployment's actual capability can never drift apart.
    def self.status_label
      case mode
      when "live"
        "Protected Trade is active. Funds are held by the connected payment provider until release."
      when "sandbox"
        "Protected Trade is running against a provider sandbox. No real funds move."
      else
        "Protected Trade is not activated yet. A licensed payment provider must be connected first."
      end
    end
  end

  class DisabledProvider
    attr_reader :trade_order

    def initialize(trade_order)
      @trade_order = trade_order
    end

    def name
      "disabled"
    end

    def available?
      false
    end

    def funding_action(_payment)
      nil
    end

    def reconcile!(_payment)
      raise NotImplementedError, "A live protected-payment adapter is required"
    end
  end

  class SandboxProvider
    attr_reader :trade_order

    def initialize(trade_order)
      @trade_order = trade_order
    end

    def name
      "sandbox"
    end

    def available?
      Provider.sandbox_allowed?
    end

    def funding_action(payment)
      { method: "POST", path: "/business/trade_orders/#{trade_order.id}/sandbox_funding", paymentId: payment.id }
    end

    def reconcile!(payment)
      payment
    end

    def fund!
      payment = trade_order.protected_payment || trade_order.create_protected_payment!(
        provider: name, currency: trade_order.currency, amount_cents: trade_order.total_cents, status: :funding_pending
      )
      external_id = "sandbox-payment-#{payment.id}"
      payload = {
        id: "sandbox-funded-#{payment.id}",
        type: "payment.funded",
        data: { payment_id: payment.id, trade_order_id: trade_order.id, external_id: external_id,
                amount_cents: payment.amount_cents, currency: payment.currency }
      }
      WebhookProcessor.process!(provider: name, payload: payload, signature: sign(payload))
      TradeOrderSerializer.render(trade_order.reload)
    end

    def release!(amount_cents: nil, force: false)
      payment = trade_order.protected_payment
      raise ActiveRecord::RecordNotFound unless payment
      raise ArgumentError, "The trade is not eligible for release" unless force || trade_order.release_allowed?

      amount_cents = payment.releasable_cents if amount_cents.blank?
      raise ArgumentError, "Release exceeds the protected amount" if amount_cents.to_i > payment.releasable_cents

      payload = {
        id: "sandbox-released-#{payment.id}-#{amount_cents}",
        type: "payment.released",
        data: { payment_id: payment.id, trade_order_id: trade_order.id,
                external_id: "sandbox-release-#{payment.id}-#{amount_cents}", amount_cents: amount_cents }
      }
      WebhookProcessor.process!(provider: name, payload: payload, signature: sign(payload))
      TradeOrderSerializer.render(trade_order.reload)
    end

    def refund!(amount_cents: trade_order.total_cents)
      payment = trade_order.protected_payment
      raise ActiveRecord::RecordNotFound unless payment

      payload = {
        id: "sandbox-refunded-#{payment.id}-#{amount_cents}",
        type: "payment.refunded",
        data: { payment_id: payment.id, trade_order_id: trade_order.id,
                external_id: "sandbox-refund-#{payment.id}-#{amount_cents}", amount_cents: amount_cents }
      }
      WebhookProcessor.process!(provider: name, payload: payload, signature: sign(payload))
      TradeOrderSerializer.render(trade_order.reload)
    end

    private

    def sign(payload)
      OpenSSL::HMAC.hexdigest(OpenSSL::Digest::SHA256.new, secret, JSON.generate(payload))
    end

    def secret
      ENV.fetch("SANDBOX_WEBHOOK_SECRET") { raise ArgumentError, "Sandbox webhook secret is not configured." }
    end
  end

  class WebhookProcessor
    def self.receive!(provider:, raw_body:, signature:)
      verify_signature!(provider: provider, body: raw_body, signature: signature)
      payload = JSON.parse(raw_body).deep_stringify_keys
      create_event!(provider: provider, payload: payload, body: raw_body)
    end

    def self.process!(provider:, payload:, signature:)
      body = JSON.generate(payload.deep_stringify_keys)
      process_event!(receive!(provider: provider, raw_body: body, signature: signature))
    end

    def self.process_event!(event)
      return event if event.processed?

      event.update!(status: :processing, attempts: event.attempts + 1)
      payload = event.payload.deep_stringify_keys
      payment = ProtectedPayment.find(payload.dig("data", "payment_id"))
      case payload.fetch("type")
      when "payment.funded"
        payment.fund!(external_id: payload.dig("data", "external_id"))
      when "payment.released"
        payment.release!(amount_cents: payload.dig("data", "amount_cents").to_i,
                        external_reference: payload.dig("data", "external_id"))
      when "payment.refunded"
        payment.refund!(amount_cents: payload.dig("data", "amount_cents").to_i,
                       external_reference: payload.dig("data", "external_id"))
      else
        raise ArgumentError, "Unsupported provider event"
      end
      event.update!(status: :processed, processed_at: Time.current)
      event
    rescue StandardError => error
      event&.update(status: :failed, error: error.message)
      raise
    end

    def self.verify_signature!(provider:, body:, signature:)
      secret_name = provider.to_s == "sandbox" ? "SANDBOX_WEBHOOK_SECRET" : "#{provider.to_s.upcase}_WEBHOOK_SECRET"
      secret = ENV.fetch(secret_name) { raise ArgumentError, "Provider webhook secret is not configured." }
      expected = OpenSSL::HMAC.hexdigest(OpenSSL::Digest::SHA256.new, secret, body.to_s)
      valid = signature.present? && signature.bytesize == expected.bytesize &&
              ActiveSupport::SecurityUtils.secure_compare(expected, signature)
      raise ArgumentError, "Invalid provider signature" unless valid
    end

    def self.create_event!(provider:, payload:, body:)
      checksum = Digest::SHA256.hexdigest(body)
      existing = ProviderEvent.find_by(provider: provider, external_event_id: payload.fetch("id"))
      if existing
        raise ArgumentError, "Provider event payload does not match the recorded event" unless existing.payload_checksum == checksum

        return existing
      end

      ProviderEvent.create!(provider: provider, external_event_id: payload.fetch("id")) do |record|
        record.event_type = payload.fetch("type")
        record.payload_checksum = checksum
        record.payload = payload
        record.status = :received
      end
    rescue ActiveRecord::RecordNotUnique
      existing = ProviderEvent.find_by!(provider: provider, external_event_id: payload.fetch("id"))
      raise ArgumentError, "Provider event payload does not match the recorded event" unless existing.payload_checksum == checksum

      existing
    end
  end
end
