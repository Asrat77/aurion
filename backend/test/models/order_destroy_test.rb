require "test_helper"

class OrderDestroyTest < ActiveSupport::TestCase
  def setup
    category = Category.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(4)}")
    user = User.create!(email: "v-#{SecureRandom.hex(4)}@example.com", password: "password123",
                        name: "V", role: :vendor)
    @vendor = Vendor.create!(user: user, store_name: "Store #{SecureRandom.hex(4)}")
    @product = Product.create!(vendor: @vendor, category: category, name: "Coffee",
                               price_cents: 1000, stock: 10, status: :active)
    @buyer = User.create!(email: "b-#{SecureRandom.hex(4)}@example.com", password: "password123",
                          name: "Buyer", role: :buyer)
  end

  test "an order with item-scoped timeline events can be destroyed" do
    order = Order.create!(buyer: @buyer, status: :pending, subtotal_cents: 1000, shipping_cents: 0,
                          tax_cents: 0, total_cents: 1000, currency: "USD", fx_rate: 1)
    item = order.order_items.create!(product: @product, vendor: @vendor, product_name: @product.name,
                                     unit_price_cents: 1000, quantity: 1, line_total_cents: 1000,
                                     commission_cents: 150, net_cents: 850)
    order.mark_paid!
    order.advance_item!(item, :processing, actor: @vendor.user)

    assert order.order_events.where.not(order_item_id: nil).exists?,
           "the fixture needs an event tied to the item"

    # Payouts restrict deletion of their order_item, so they go first — as they
    # would in any real teardown.
    Payout.where(order_item: order.order_items).destroy_all

    assert_nothing_raised { order.destroy! }
    refute Order.exists?(order.id)
    refute OrderEvent.exists?(order_id: order.id)
  end
end
