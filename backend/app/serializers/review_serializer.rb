class ReviewSerializer
  def self.render(review)
    {
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      # First name only: a review is public, and buyers did not sign up to have
      # their full name indexed against a purchase.
      authorName: review.buyer.name.to_s.split(" ").first,
      productName: review.product.name,
      productSlug: review.product.slug,
      createdAt: review.created_at.iso8601
    }
  end
end
