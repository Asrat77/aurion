class PaymentGateway
  # Resolves the gateway adapter for an order: Chapa for ETB, Stripe for USD,
  # falling back to the mock adapter whenever the relevant API key isn't
  # configured. Real adapters are added in Milestone 6.
  def self.for(order)
    case order.currency
    when "ETB"
      if ENV["CHAPA_SECRET_KEY"].present?
        PaymentGateways::ChapaGateway.new(order)
      else
        PaymentGateways::MockGateway.new(order)
      end
    else
      if ENV["STRIPE_SECRET_KEY"].present?
        PaymentGateways::StripeGateway.new(order)
      else
        PaymentGateways::MockGateway.new(order)
      end
    end
  end
end
