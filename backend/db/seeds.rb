# Idempotent demo data for development and staging. Production must never
# create public demo credentials or mock-money accounts during container boot.
if Rails.env.production?
  puts "Skipping demo seeds in production."
else

demo_password = ENV["STAGING_DEMO_PASSWORD"].presence || SecureRandom.base58(24)

puts "Seeding categories..."
CATEGORIES = %w[coffee teff spices honey textiles jewelry superfoods].map do |slug|
  Category.find_or_create_by!(slug: slug) do |c|
    c.name = slug == "teff" ? "Teff & Grains" : slug.capitalize
  end
end
categories_by_slug = CATEGORIES.index_by(&:slug)

puts "Seeding vendors..."
VENDOR_DEFS = [
  { store: "Aurion Coffee Co.", email: "vendor@aurion.et" },
  { store: "Ethio Grains", email: "ethio.grains@vendors.aurion.et" },
  { store: "Spice Route ET", email: "spice.route@vendors.aurion.et" },
  { store: "Bee Natural ET", email: "bee.natural@vendors.aurion.et" },
  { store: "Sheba Textiles", email: "sheba.textiles@vendors.aurion.et" },
  { store: "Aurion Jewels", email: "aurion.jewels@vendors.aurion.et" },
  { store: "Green Valley ET", email: "green.valley@vendors.aurion.et" }
]

vendors_by_store = VENDOR_DEFS.each_with_object({}) do |v, acc|
  user = User.find_or_create_by!(email: v[:email]) do |u|
    u.name = v[:store]
    u.password = demo_password
    u.role = :vendor
  end
  vendor = Vendor.find_or_create_by!(user: user) do |ven|
    ven.store_name = v[:store]
    ven.status = :active
  end
  organization = Organization.find_or_create_by!(name: v[:store], kind: "supplier") do |org|
    org.status = :active
    org.verification_status = :verified
    org.country = "Ethiopia"
  end
  organization.update!(status: :active, verification_status: :verified)
  organization.memberships.find_or_create_by!(user: user) { |membership| membership.role = :owner }
  vendor.update!(organization: organization)
  acc[v[:store]] = vendor
end

puts "Seeding demo admin & buyer..."
User.find_or_create_by!(email: "admin@aurion.et") do |u|
  u.name = "Aurion Admin"
  u.password = demo_password
  u.role = :admin
end

demo_buyer = User.find_or_create_by!(email: "buyer@aurion.et") do |u|
  u.name = "Demo Buyer"
  u.password = demo_password
  u.role = :buyer
end
demo_buyer_org = Organization.find_or_create_by!(name: "Demo Buyer Organization", kind: "buyer") do |org|
  org.status = :active
  org.verification_status = :verified
  org.country = "Ethiopia"
end
demo_buyer_org.update!(status: :active, verification_status: :verified)
demo_buyer_org.memberships.find_or_create_by!(user: demo_buyer) { |membership| membership.role = :owner }

puts "Seeding products..."
PRODUCT_DEFS = [
  { name: "Yirgacheffe Specialty Coffee", category: "coffee", price: 28.50, emoji: "☕",
    origin: "Yirgacheffe, Ethiopia", vendor: "Aurion Coffee Co.", rating: 4.8, reviews: 124,
    description: "Single-origin, washed process, floral and citrus notes. 250g roasted whole beans." },
  { name: "Sidamo Organic Coffee", category: "coffee", price: 24.00, emoji: "☕",
    origin: "Sidamo, Ethiopia", vendor: "Aurion Coffee Co.", rating: 4.6, reviews: 98,
    description: "Medium roast, chocolate and berry notes. 250g, shade-grown, organic certified." },
  { name: "Premium Teff Flour", category: "teff", price: 12.50, emoji: "🌾",
    origin: "Oromia, Ethiopia", vendor: "Ethio Grains", rating: 4.7, reviews: 56,
    description: "Gluten-free supergrain. 1kg stone-ground whole-grain teff flour for injera and baking." },
  { name: "Teff Grain — Whole", category: "teff", price: 14.00, emoji: "🌾",
    origin: "Amhara, Ethiopia", vendor: "Ethio Grains", rating: 4.5, reviews: 42,
    description: "Whole teff grain, ivory variety. 1kg, high in protein, calcium, and iron." },
  { name: "Berbere Spice Blend", category: "spices", price: 9.00, emoji: "🌶️",
    origin: "Gurage, Ethiopia", vendor: "Spice Route ET", rating: 4.9, reviews: 210,
    description: "Traditional Ethiopian chili blend with fenugreek, cardamom, and ginger. 100g." },
  { name: "Mitmita Spice Blend", category: "spices", price: 8.50, emoji: "🔥",
    origin: "SNNPR, Ethiopia", vendor: "Spice Route ET", rating: 4.7, reviews: 89,
    description: "Hot spice blend with bird's eye chili, korarima, and garlic. 80g." },
  { name: "White Honey — Forest", category: "honey", price: 22.00, emoji: "🍯",
    origin: "Tigray, Ethiopia", vendor: "Bee Natural ET", rating: 4.8, reviews: 67,
    description: "Pure white honey from highland forests. 500g, raw and unfiltered." },
  { name: "Infused Honey — Coffee", category: "honey", price: 26.00, emoji: "🍯",
    origin: "Oromia, Ethiopia", vendor: "Bee Natural ET", rating: 4.6, reviews: 45,
    description: "Honey infused with roasted coffee beans. 350g, unique flavor profile." },
  { name: "Handwoven Cotton Scarf", category: "textiles", price: 45.00, emoji: "🧣",
    origin: "Addis Ababa, Ethiopia", vendor: "Sheba Textiles", rating: 4.4, reviews: 34,
    description: "Traditional handwoven cotton scarf with modern design. 180cm × 60cm, natural dyes." },
  { name: "Tibeb Cotton Fabric", category: "textiles", price: 68.00, emoji: "🧵",
    origin: "Gamo, Ethiopia", vendor: "Sheba Textiles", rating: 4.5, reviews: 28,
    description: "Handwoven tibeb fabric with intricate patterns. 120cm × 150cm, 100% cotton." },
  { name: "Gold Filigree Necklace", category: "jewelry", price: 350.00, emoji: "📿",
    origin: "Addis Ababa, Ethiopia", vendor: "Aurion Jewels", rating: 4.9, reviews: 156,
    description: "18K gold filigree necklace, handcrafted by master artisans. 45cm length, 24ct chain." },
  { name: "Welo Opal Pendant", category: "jewelry", price: 520.00, emoji: "💎",
    origin: "Wollo, Ethiopia", vendor: "Aurion Jewels", rating: 4.8, reviews: 89,
    description: "Ethiopian Welo opal in 18K gold setting. Color play: blue, green, orange. 8mm cabochon." },
  { name: "Moringa Powder — Organic", category: "superfoods", price: 18.00, emoji: "🌿",
    origin: "Rift Valley, Ethiopia", vendor: "Green Valley ET", rating: 4.7, reviews: 73,
    description: "Organic moringa oleifera powder. 200g, high in vitamins A, C, and iron." },
  { name: "Spirulina — Ethiopian", category: "superfoods", price: 32.00, emoji: "🟢",
    origin: "Rift Valley, Ethiopia", vendor: "Green Valley ET", rating: 4.6, reviews: 52,
    description: "Premium spirulina powder from Ethiopian lakes. 100g, high protein content." },
  { name: "Korarima — Ethiopian Cardamom", category: "spices", price: 15.00, emoji: "🌱",
    origin: "SNNPR, Ethiopia", vendor: "Spice Route ET", rating: 4.8, reviews: 104,
    description: "Ethiopian korarima (false cardamom). 50g, aromatic and earthy flavor." },
  { name: "Black Cumin — Whole", category: "spices", price: 11.00, emoji: "🖤",
    origin: "Oromia, Ethiopia", vendor: "Spice Route ET", rating: 4.4, reviews: 61,
    description: "Whole black cumin seeds. 100g, earthy and slightly bitter flavor." }
]

PRODUCT_DEFS.each_with_index do |p, index|
  product = Product.find_or_create_by!(name: p[:name]) do |new_product|
    new_product.category = categories_by_slug.fetch(p[:category])
    new_product.vendor = vendors_by_store.fetch(p[:vendor])
    new_product.price_cents = (p[:price] * 100).round
    new_product.currency = "USD"
    new_product.stock = 100
    new_product.emoji = p[:emoji]
    new_product.origin = p[:origin]
    new_product.description = p[:description]
    new_product.status = :active
    # rating and reviews_count are derived from real Review rows below — never
    # set them directly, or the product header and the reviews section disagree.
  end

  # Applied outside the create block so re-running the seed keeps it true of
  # products that already exist. Every third product ships free, which gives the
  # free-shipping filter something to find.
  product.update!(free_shipping: (index % 3).zero?)
end

# Commercial terms for the wholesale catalogue. Only some products are offered
# at scale — a marketplace where everything has an MOQ is not a marketplace.
puts "Seeding wholesale terms..."

WHOLESALE_DEFS = {
  "Yirgacheffe Specialty Coffee" => { moq: 500, uom: "kg", lead: 21, packaging: "60kg jute bags, GrainPro lined",
                                       sample: true, sample_price: 3500,
                                       tiers: [ [ 500, 2400 ], [ 2_000, 2150 ], [ 10_000, 1900 ] ] },
  "Sidamo Organic Coffee" => { moq: 500, uom: "kg", lead: 21, packaging: "60kg jute bags",
                                sample: true, sample_price: 3000,
                                tiers: [ [ 500, 2050 ], [ 2_000, 1850 ], [ 10_000, 1650 ] ] },
  "Premium Teff Flour" => { moq: 1_000, uom: "kg", lead: 14, packaging: "25kg multiwall paper sacks",
                             sample: true, sample_price: 2000,
                             tiers: [ [ 1_000, 1050 ], [ 5_000, 940 ], [ 20_000, 820 ] ] },
  "Berbere Spice Blend" => { moq: 250, uom: "kg", lead: 10, packaging: "10kg food-grade pails",
                              sample: true, sample_price: 1500,
                              tiers: [ [ 250, 780 ], [ 1_000, 690 ], [ 5_000, 610 ] ] },
  "White Honey — Forest" => { moq: 200, uom: "kg", lead: 18, packaging: "25kg HDPE drums",
                               sample: false, sample_price: nil,
                               tiers: [ [ 200, 1900 ], [ 1_000, 1700 ] ] },
  "Handwoven Cotton Scarf" => { moq: 100, uom: "pieces", lead: 30, packaging: "Individually wrapped, 50 per carton",
                                 sample: true, sample_price: 5500,
                                 tiers: [ [ 100, 3800 ], [ 500, 3300 ] ] }
}.freeze

WHOLESALE_DEFS.each do |name, terms|
  product = Product.find_by(name: name)
  next unless product

  product.update!(
    moq: terms[:moq],
    unit_of_measure: terms[:uom],
    lead_time_days: terms[:lead],
    packaging: terms[:packaging],
    sample_available: terms[:sample],
    sample_price_cents: terms[:sample_price],
    business_enabled: true,
  )

  terms[:tiers].each do |min_quantity, unit_price_cents|
    tier = product.price_tiers.find_or_initialize_by(min_quantity: min_quantity)
    tier.update!(unit_price_cents: unit_price_cents)
  end
end

puts "Seeding supplier capabilities..."
WHOLESALE_DEFS.each do |name, terms|
  product = Product.find_by(name: name)
  next unless product

  product.vendor.supplier_capabilities.find_or_create_by!(category: product.category) do |capability|
    capability.destinations = [ "Ethiopia", "United States", "United Arab Emirates", "Germany" ]
    capability.min_quantity = terms[:moq]
    capability.max_lead_time_days = terms[:lead]
    capability.verified = true
  end
end

# Reviews are only meaningful when a real buyer received real goods, so the
# demo ratings are backed by genuine delivered orders rather than typed in.
puts "Seeding review history..."

REVIEWER_DEFS = [
  { email: "meron@buyers.aurion.et", name: "Meron Alemu" },
  { email: "daniel@buyers.aurion.et", name: "Daniel Bekele" },
  { email: "sara@buyers.aurion.et", name: "Sara Haile" },
  { email: "yonas@buyers.aurion.et", name: "Yonas Girma" }
]

REVIEW_TEXTS = [
  [ 5, "Exactly as described", "Arrived well packed and the quality is genuinely excellent." ],
  [ 5, "Will order again", "Second time buying this. Consistent every time." ],
  [ 4, "Very good", "Happy with it overall. Shipping took a little longer than I expected." ],
  [ 4, "Good quality", "Does what it says. Packaging could be sturdier." ],
  [ 5, "Worth it", "You can taste the difference against supermarket equivalents." ]
]

reviewers = REVIEWER_DEFS.map do |r|
  User.find_or_create_by!(email: r[:email]) do |u|
    u.name = r[:name]
    u.password = demo_password
    u.role = :buyer
  end
end

# Give the first dozen products a short review history each.
Product.order(:id).limit(12).each_with_index do |product, product_index|
  reviewers.take(2 + (product_index % 3)).each_with_index do |reviewer, reviewer_index|
    next if Review.joins(:order_item)
                  .where(buyer: reviewer, order_items: { product_id: product.id })
                  .exists?

    line_total = product.price_cents
    commission = (line_total * product.vendor.commission_rate).round

    # Spread the history across the last few weeks. created_at matters as much
    # as paid_at: the vendor revenue chart buckets by order date, so leaving it
    # at "now" would stack every seeded sale on today.
    placed_at = (31 - product_index).days.ago - (reviewer_index * 7).hours

    order = Order.create!(
      buyer: reviewer,
      status: :delivered,
      subtotal_cents: line_total,
      shipping_cents: 0,
      tax_cents: 0,
      total_cents: line_total,
      currency: "USD",
      fx_rate: 1,
      created_at: placed_at,
      paid_at: placed_at + 1.hour,
      delivered_at: placed_at + 6.days,
      payment_method: "mock",
      shipping_address: { city: "Addis Ababa", country: "ET" },
    )

    item = order.order_items.create!(
      product: product,
      vendor: product.vendor,
      product_name: product.name,
      unit_price_cents: product.price_cents,
      quantity: 1,
      line_total_cents: line_total,
      commission_cents: commission,
      net_cents: line_total - commission,
      fulfillment_status: :delivered,
      shipped_at: placed_at + 2.days,
      delivered_at: placed_at + 6.days,
    )

    Payout.find_or_create_by!(order_item: item) do |payout|
      payout.vendor = item.vendor
      payout.amount_cents = item.net_cents
      payout.status = :pending
    end

    rating, title, body = REVIEW_TEXTS[(product_index + reviewer_index) % REVIEW_TEXTS.length]
    Review.create!(
      product: product,
      buyer: reviewer,
      order_item: item,
      rating: rating,
      title: title,
      body: body,
      status: :published,
    )
  end
end

puts "Done. #{Category.count} categories, #{Vendor.count} vendors, #{Product.count} products, " \
     "#{User.count} users, #{Review.count} reviews."
end
