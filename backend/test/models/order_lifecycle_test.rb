require "test_helper"

class OrderLifecycleTest < ActiveSupport::TestCase
  def setup
    @category = Category.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(4)}")
    @vendor_a = build_vendor("Vendor A")
    @vendor_b = build_vendor("Vendor B")
    @buyer = User.create!(email: "buyer-#{SecureRandom.hex(4)}@example.com", password: "password123",
                          name: "Buyer", role: :buyer)
  end

  test "cancelling an unpaid order returns stock exactly once" do
    product = build_product(@vendor_a, stock: 5)
    order = build_order(items: [ [ product, 2 ] ])
    product.decrement!(:stock, 2)

    assert order.cancel!(actor: @buyer)
    assert_equal 5, product.reload.stock

    # A second call must not inflate stock.
    order.release_stock!
    assert_equal 5, product.reload.stock
  end

  test "cancelling a paid order returns stock and removes pending payouts" do
    product = build_product(@vendor_a, stock: 5)
    order = build_order(items: [ [ product, 2 ] ])
    product.decrement!(:stock, 2)
    order.mark_paid!(payment_method: "mock")

    assert_equal 1, Payout.where(order_item: order.order_items).count

    assert order.cancel!(actor: @buyer)
    assert_equal "cancelled", order.reload.status
    assert_equal 5, product.reload.stock
    assert_equal 0, Payout.where(order_item: order.order_items).count
  end

  test "an order that has shipped can no longer be cancelled" do
    product = build_product(@vendor_a, stock: 5)
    order = build_order(items: [ [ product, 1 ] ])
    order.mark_paid!
    item = order.order_items.first

    order.advance_item!(item, :processing, actor: @vendor_a.user)
    order.advance_item!(item, :shipped, actor: @vendor_a.user, carrier: "DHL", tracking_number: "ET123")

    refute order.reload.cancellable?
    refute order.cancel!(actor: @buyer)
    assert_match(/already shipped/, order.transition_error)
  end

  test "order status follows the least advanced vendor in a multi-vendor order" do
    product_a = build_product(@vendor_a, stock: 5)
    product_b = build_product(@vendor_b, stock: 5)
    order = build_order(items: [ [ product_a, 1 ], [ product_b, 1 ] ])
    order.mark_paid!

    item_a, item_b = order.order_items.order(:id).to_a

    order.advance_item!(item_a, :processing, actor: @vendor_a.user)
    assert_equal "processing", order.reload.status

    order.advance_item!(item_a, :shipped, actor: @vendor_a.user)
    assert_equal "processing", order.reload.status, "one vendor shipping must not ship the whole order"

    order.advance_item!(item_b, :processing, actor: @vendor_b.user)
    order.advance_item!(item_b, :shipped, actor: @vendor_b.user)
    assert_equal "shipped", order.reload.status

    order.advance_item!(item_a, :delivered, actor: @vendor_a.user)
    assert_equal "shipped", order.reload.status

    order.advance_item!(item_b, :delivered, actor: @vendor_b.user)
    assert_equal "delivered", order.reload.status
    assert order.reload.delivered_at.present?
  end

  test "items cannot skip a step in the fulfilment timeline" do
    product = build_product(@vendor_a, stock: 5)
    order = build_order(items: [ [ product, 1 ] ])
    order.mark_paid!
    item = order.order_items.first

    refute order.advance_item!(item, :delivered, actor: @vendor_a.user)
    assert_match(/cannot move to delivered/, order.transition_error)
    assert_equal "awaiting", item.reload.fulfillment_status
  end

  test "items on an unpaid order cannot be advanced" do
    product = build_product(@vendor_a, stock: 5)
    order = build_order(items: [ [ product, 1 ] ])

    refute order.advance_item!(order.order_items.first, :processing, actor: @vendor_a.user)
    assert_match(/pending/, order.transition_error)
  end

  test "each transition appends a timeline event" do
    product = build_product(@vendor_a, stock: 5)
    order = build_order(items: [ [ product, 1 ] ])
    order.record_event!("Order placed", actor: @buyer)
    order.mark_paid!
    item = order.order_items.first
    order.advance_item!(item, :processing, actor: @vendor_a.user)
    order.advance_item!(item, :shipped, actor: @vendor_a.user, carrier: "DHL", tracking_number: "ET123")

    labels = order.order_events.chronologically.pluck(:label)
    assert_equal [ "Order placed", "Payment confirmed", "Vendor preparing items", "Processing",
                   "Items shipped", "Shipped" ], labels
    assert_includes order.order_events.pluck(:note), "DHL: ET123"
  end

  private

  def build_vendor(name)
    user = User.create!(email: "#{name.parameterize}-#{SecureRandom.hex(4)}@example.com",
                        password: "password123", name: name, role: :vendor)
    Vendor.create!(user: user, store_name: "#{name} #{SecureRandom.hex(4)}", commission_rate: 0.15)
  end

  def build_product(vendor, stock:)
    Product.create!(vendor: vendor, category: @category, name: "Product #{SecureRandom.hex(4)}",
                    price_cents: 1000, stock: stock, status: :active)
  end

  def build_order(items:)
    subtotal = items.sum { |product, qty| product.price_cents * qty }
    order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: subtotal,
                          shipping_cents: 0, tax_cents: 0, total_cents: subtotal,
                          currency: "USD", fx_rate: 1)
    items.each do |product, qty|
      line_total = product.price_cents * qty
      commission = (line_total * product.vendor.commission_rate).round
      order.order_items.create!(product: product, vendor: product.vendor, product_name: product.name,
                                unit_price_cents: product.price_cents, quantity: qty,
                                line_total_cents: line_total, commission_cents: commission,
                                net_cents: line_total - commission)
    end
    order
  end
end
