class PayoutSerializer
  def self.render(payout)
    {
      id: payout.id,
      amountCents: payout.amount_cents,
      status: payout.status,
      state: payout.state,
      orderReference: payout.order_item.order.reference,
      productName: payout.order_item.product_name,
      createdAt: payout.created_at
    }
  end
end
