# Idempotent seed data ported from the AURION marketplace prototype.
# Safe to run multiple times: find_or_create_by! everywhere.

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
  { store: "Green Valley ET", email: "green.valley@vendors.aurion.et" },
]

vendors_by_store = VENDOR_DEFS.each_with_object({}) do |v, acc|
  user = User.find_or_create_by!(email: v[:email]) do |u|
    u.name = v[:store]
    u.password = "aurion123"
    u.role = :vendor
  end
  vendor = Vendor.find_or_create_by!(user: user) do |ven|
    ven.store_name = v[:store]
    ven.status = :active
  end
  acc[v[:store]] = vendor
end

puts "Seeding demo admin & buyer..."
User.find_or_create_by!(email: "admin@aurion.et") do |u|
  u.name = "Aurion Admin"
  u.password = "aurion123"
  u.role = :admin
end

User.find_or_create_by!(email: "buyer@aurion.et") do |u|
  u.name = "Demo Buyer"
  u.password = "aurion123"
  u.role = :buyer
end

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
    description: "Whole black cumin seeds. 100g, earthy and slightly bitter flavor." },
]

PRODUCT_DEFS.each do |p|
  Product.find_or_create_by!(name: p[:name]) do |product|
    product.category = categories_by_slug.fetch(p[:category])
    product.vendor = vendors_by_store.fetch(p[:vendor])
    product.price_cents = (p[:price] * 100).round
    product.currency = "USD"
    product.stock = 100
    product.emoji = p[:emoji]
    product.origin = p[:origin]
    product.description = p[:description]
    product.rating = p[:rating]
    product.reviews_count = p[:reviews]
    product.status = :active
  end
end

puts "Done. #{Category.count} categories, #{Vendor.count} vendors, #{Product.count} products, #{User.count} users."
