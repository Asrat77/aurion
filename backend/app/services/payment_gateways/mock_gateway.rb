module PaymentGateways
  # Completes the order instantly. Used whenever a real gateway's API key
  # isn't configured, so the full marketplace loop still works with zero
  # external accounts set up.
  class MockGateway
    def initialize(order)
      @order = order
    end

    def create_intent
      { type: "mock", orderId: @order.id, message: "No payment provider configured — confirm to simulate payment." }
    end

    def available?
      true
    end
  end

  class DisabledGateway
    def initialize(order)
      @order = order
    end

    def available?
      false
    end

    def create_intent
      raise PaymentGatewayUnavailable, "A live retail payment provider is not configured."
    end
  end
end
