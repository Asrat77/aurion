# The star breakdown shown above a product's reviews: an average plus how many
# reviews sit at each rating, which is what lets a buyer tell "4.5 from 2
# reviews" apart from "4.5 from 200".
class ReviewSummary
  def self.for(product)
    counts = product.reviews.visible.group(:rating).count
    total = counts.values.sum

    {
      average: total.zero? ? nil : (counts.sum { |rating, n| rating * n }.to_f / total).round(2),
      total: total,
      distribution: (1..5).to_h { |rating| [ rating, counts.fetch(rating, 0) ] }
    }
  end
end
