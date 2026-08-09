class PaymentGateway
  # Resolves the payment adapter for an order.
  #
  # Only the mock adapter ships today: it completes the order instantly, so the
  # full marketplace loop works with zero external accounts configured.
  #
  # Chapa is the intended live gateway — it fronts Telebirr and CBE Birr behind
  # one REST API, which is why it beats integrating Telebirr directly. It needs
  # registered-business credentials, so the adapter is deliberately left
  # unwritten rather than half-wired: to add it, create
  # PaymentGateways::ChapaGateway responding to #create_intent and return it
  # here for ETB orders. Its webhook must verify the HMAC-SHA256 signature and
  # then call Order#mark_paid!, which is already idempotent.
  def self.for(order)
    return PaymentGateways::DisabledGateway.new(order) if Rails.env.production?

    PaymentGateways::MockGateway.new(order)
  end
end
