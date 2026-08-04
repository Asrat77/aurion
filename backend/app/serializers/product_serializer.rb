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
    }
  end
end
