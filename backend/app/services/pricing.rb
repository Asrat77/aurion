# Single source of truth for what an order costs. Checkout asks for a quote
# before the buyer commits, and Orders#create prices the real order through the
# same code, so the figure shown and the figure charged cannot drift apart.
class Pricing
  # Destination shipping in base-currency cents. Ethiopia is domestic; the rest
  # of Africa is regional; everywhere else is international air freight.
  DOMESTIC = "ET".freeze
  REGIONAL_COUNTRIES = %w[KE NG ZA DJ SO SD SS ER UG TZ RW].freeze

  SHIPPING_CENTS = {
    domestic: 400,
    regional: 1_200,
    international: 1_800
  }.freeze

  # Orders at or above this subtotal ship free, whatever the destination.
  FREE_SHIPPING_THRESHOLD_CENTS = 15_000

  # Ethiopian VAT applies to goods delivered inside Ethiopia. Exports are
  # zero-rated, which is why an international order carries no tax line.
  ETHIOPIA_VAT_RATE = 0.15

  Quote = Struct.new(
    :subtotal_cents, :shipping_cents, :tax_cents, :total_cents,
    :currency, :fx_rate, :tax_label, :free_shipping_applied,
    keyword_init: true
  ) do
    def to_h
      {
        subtotalCents: subtotal_cents,
        shippingCents: shipping_cents,
        taxCents: tax_cents,
        totalCents: total_cents,
        currency: currency,
        fxRate: fx_rate,
        taxLabel: tax_label,
        freeShippingApplied: free_shipping_applied
      }
    end
  end

  # `lines` is an array of [product, quantity] pairs.
  def self.quote(lines:, country:)
    country = country.to_s.upcase
    subtotal_cents = lines.sum { |product, qty| product.price_cents * qty }

    shipping_cents = shipping_for(lines: lines, country: country, subtotal_cents: subtotal_cents)
    domestic = country == DOMESTIC
    tax_cents = domestic ? (subtotal_cents * ETHIOPIA_VAT_RATE).round : 0

    Quote.new(
      subtotal_cents: subtotal_cents,
      shipping_cents: shipping_cents,
      tax_cents: tax_cents,
      total_cents: subtotal_cents + shipping_cents + tax_cents,
      currency: domestic ? "ETB" : "USD",
      fx_rate: domestic ? etb_per_usd : 1.0,
      tax_label: domestic ? "VAT (15%)" : "Tax (export, zero-rated)",
      free_shipping_applied: subtotal_cents.positive? && shipping_cents.zero?
    )
  end

  def self.zone_for(country)
    return :domestic if country == DOMESTIC
    return :regional if REGIONAL_COUNTRIES.include?(country)

    :international
  end

  def self.etb_per_usd
    ENV.fetch("ETB_PER_USD", 140).to_f
  end

  def self.shipping_for(lines:, country:, subtotal_cents:)
    return 0 if subtotal_cents.zero?
    return 0 if subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS
    # A cart ships free only when every item in it does — one paid item still
    # needs a box sent.
    return 0 if lines.all? { |product, _qty| product.free_shipping? }

    SHIPPING_CENTS.fetch(zone_for(country))
  end
end
