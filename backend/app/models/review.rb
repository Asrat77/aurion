class Review < ApplicationRecord
  # Published on submission and hidden only if a moderator acts. Holding every
  # review for approval would leave products looking unreviewed for days, which
  # is the problem reviews exist to solve.
  enum :status, { published: 0, hidden: 1 }

  belongs_to :product
  belongs_to :buyer, class_name: "User"
  belongs_to :order_item

  validates :rating, inclusion: { in: 1..5 }
  validates :body, length: { maximum: 2000 }
  validates :order_item_id, uniqueness: { message: "has already been reviewed" }
  validate :order_item_belongs_to_buyer
  validate :order_item_delivered

  after_save :refresh_product_rating
  after_destroy :refresh_product_rating

  scope :visible, -> { where(status: :published) }
  scope :recent_first, -> { order(created_at: :desc) }

  # A buyer may review a product once for each delivered line of it they own.
  def self.reviewable_order_items_for(user)
    OrderItem.joins(:order)
             .where(orders: { buyer_id: user.id })
             .where(fulfillment_status: :delivered)
             .where.missing(:review)
  end

  private

  def order_item_belongs_to_buyer
    return if order_item.nil? || buyer.nil?
    return if order_item.order.buyer_id == buyer_id

    errors.add(:order_item, "does not belong to this buyer")
  end

  def order_item_delivered
    return if order_item.nil?
    return if order_item.fulfillment_delivered?

    errors.add(:base, "You can review a product once it has been delivered.")
  end

  # products.rating / reviews_count are denormalised so listings can sort and
  # filter on them without aggregating on every request.
  def refresh_product_rating
    visible = Review.visible.where(product_id: product_id)
    count = visible.count

    product.update_columns(
      rating: count.zero? ? nil : visible.average(:rating).to_f.round(2),
      reviews_count: count,
      updated_at: Time.current
    )
  end
end
