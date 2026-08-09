require "test_helper"

class BusinessTradeTest < ActiveSupport::TestCase
  setup do
    @buyer = User.create!(email: "buyer-#{SecureRandom.hex(4)}@example.com", name: "Buyer", password: "password123")
    @supplier_user = User.create!(email: "supplier-#{SecureRandom.hex(4)}@example.com", name: "Supplier", password: "password123", role: :vendor)
    @admin = User.create!(email: "admin-#{SecureRandom.hex(4)}@example.com", name: "Admin", password: "password123", role: :admin)
    @buyer_organization = Organization.create!(name: "Buyer Co", kind: "buyer", status: "active", verification_status: "verified")
    @supplier_organization = Organization.create!(name: "Supplier Co", kind: "supplier", status: "active", verification_status: "verified")
    @buyer_organization.memberships.create!(user: @buyer, role: "owner")
    @supplier_organization.memberships.create!(user: @supplier_user, role: "owner")
    @vendor = Vendor.create!(user: @supplier_user, organization: @supplier_organization, store_name: "Supplier Co", status: :active)
    @category = Category.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(3)}")
    @product = Product.create!(name: "Coffee", slug: "coffee-#{SecureRandom.hex(3)}", vendor: @vendor,
                               category: @category, price_cents: 1000, stock: 100,
                               moq: 10, business_enabled: true)
    @vendor.supplier_capabilities.create!(category: @category, destinations: [ "Ethiopia" ],
                                          min_quantity: 10, max_lead_time_days: 30, verified: true)
    @rfq = @buyer_organization.request_for_quotes.create!(buyer: @buyer, company_name: @buyer_organization.name,
                                                          contact_name: @buyer.name, email: @buyer.email,
                                                          country: "Ethiopia", product_interest: @product.name,
                                                          product: @product, estimated_quantity: "100",
                                                          specifications: "Washed beans", status: "new")
    @rfq.items.create!(product: @product, description: @product.name, quantity: 100)
  end

  test "matching invites an eligible supplier with explainable reasons" do
    candidates = @rfq.invite_suppliers!

    assert_equal [ @vendor.id ], candidates.map(&:vendor).map(&:id)
    invitation = @rfq.supplier_invitations.sole
    assert_equal "invited", invitation.status
    assert_includes invitation.reasons, "Exact product capability"
    assert_equal 1, Notification.where(user: @supplier_user).count
  end

  test "quotation acceptance creates a digest-bound trade and sandbox lifecycle completes" do
    @rfq.invite_suppliers!
    quotation = @rfq.quotations.create!(vendor: @vendor, currency: "USD", lead_time_days: 14, shipping_cents: 500)
    quotation.items.create!(product: @product, description: @product.name, quantity: 100, unit_price_cents: 800)
    quotation.submit!

    trade_order = quotation.accept!(buyer: @buyer, organization: @buyer_organization)
    assert_equal "awaiting_acceptance", trade_order.status
    trade_order.accept!(user: @supplier_user, organization: @supplier_organization, role: "supplier")
    assert trade_order.reload.fully_accepted?
    assert_equal "awaiting_funding", trade_order.status

    with_sandbox_provider do
      ProtectedPayments::SandboxProvider.new(trade_order).fund!
    end

    shipment = trade_order.create_shipment!
    shipment.ship!(carrier: "Aurion Logistics", tracking_number: "AUR-TRACK-1")
    shipment.verify_delivery!(admin: @admin)
    trade_order.accept_delivery!(user: @buyer, organization: @buyer_organization)

    with_sandbox_provider do
      ProtectedPayments::SandboxProvider.new(trade_order).release!
    end

    assert_equal "completed", trade_order.reload.status
    assert_equal "settled", trade_order.protected_payment.status
    assert_equal trade_order.total_cents, trade_order.financial_movements.where(movement_type: "released").sum(:amount_cents)
  end

  test "a resolved dispute settles an exact refund and release split" do
    rfq = @buyer_organization.request_for_quotes.create!(buyer: @buyer, company_name: @buyer_organization.name,
                                                         contact_name: @buyer.name, email: @buyer.email,
                                                         country: "Ethiopia", product_interest: @product.name,
                                                         product: @product, estimated_quantity: "100",
                                                         specifications: "Dispute scenario", status: "new")
    rfq.items.create!(product: @product, description: @product.name, quantity: 100)
    rfq.invite_suppliers!
    quotation = rfq.quotations.create!(vendor: @vendor, currency: "USD", shipping_cents: 0)
    quotation.items.create!(product: @product, description: @product.name, quantity: 100, unit_price_cents: 800)
    quotation.submit!
    trade_order = quotation.accept!(buyer: @buyer, organization: @buyer_organization)
    trade_order.accept!(user: @supplier_user, organization: @supplier_organization, role: "supplier")
    with_sandbox_provider { ProtectedPayments::SandboxProvider.new(trade_order).fund! }

    shipment = trade_order.create_shipment!
    shipment.ship!(carrier: "Aurion Logistics", tracking_number: "AUR-DISPUTE-1")
    shipment.verify_delivery!(admin: @admin)
    dispute = trade_order.open_dispute!(user: @buyer, reason: "damaged", detail: "Evidence attached")
    refund_cents = 10_000
    release_cents = trade_order.total_cents - refund_cents
    dispute.resolve!(admin: @admin, refund_cents: refund_cents, release_cents: release_cents)

    with_sandbox_provider do
      ProtectedPayments::SandboxProvider.new(trade_order).refund!(amount_cents: refund_cents)
      ProtectedPayments::SandboxProvider.new(trade_order).release!(amount_cents: release_cents, force: true)
    end

    payment = trade_order.reload.protected_payment
    assert_equal "settled", payment.status
    assert_equal trade_order.total_cents, payment.refunded_cents + payment.released_cents
    assert_equal "completed", trade_order.status
  end

  private

  def with_sandbox_provider
    previous = ENV["PROTECTED_PAYMENT_PROVIDER"]
    previous_secret = ENV["SANDBOX_WEBHOOK_SECRET"]
    ENV["PROTECTED_PAYMENT_PROVIDER"] = "sandbox"
    ENV["SANDBOX_WEBHOOK_SECRET"] = "test-sandbox-secret"
    yield
  ensure
    ENV["PROTECTED_PAYMENT_PROVIDER"] = previous
    ENV["SANDBOX_WEBHOOK_SECRET"] = previous_secret
  end
end
