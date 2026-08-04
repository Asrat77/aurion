class ProductSerializer
  def self.render(product)
    return nil unless product

    {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      priceCents: product.price_cents,
      currency: product.currency,
      stock: product.stock,
      emoji: product.emoji,
      origin: product.origin,
      freeShipping: product.free_shipping,
      rating: product.rating&.to_f,
      reviewsCount: product.reviews_count,
      status: product.status,
      category: CategorySerializer.render(product.category),
      vendor: {
        id: product.vendor.id,
        storeName: product.vendor.store_name,
        slug: product.vendor.slug,
      },
      wholesale: wholesale_terms(product),
    }
  end

  # Nil for retail-only products, so the UI can simply check for its presence
  # rather than testing a scatter of individual fields.
  def self.wholesale_terms(product)
    return nil unless product.wholesale?

    {
      moq: product.moq,
      unitOfMeasure: product.unit_of_measure,
      leadTimeDays: product.lead_time_days,
      packaging: product.packaging,
      sampleAvailable: product.sample_available,
      samplePriceCents: product.sample_price_cents,
      priceTiers: product.price_tiers.by_quantity.map { |tier|
        { minQuantity: tier.min_quantity, unitPriceCents: tier.unit_price_cents }
      }
    }
  end
end
