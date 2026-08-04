module Api
  module V1
    class ReviewsController < ApplicationController
      before_action :authenticate!, except: :index

      # Public: the reviews shown on a product page.
      def index
        product = Product.find_by!(slug: params[:product_slug])
        reviews = product.reviews.visible.includes(:buyer).recent_first

        render json: {
          summary: ReviewSummary.for(product),
          reviews: reviews.map { |r| ReviewSerializer.render(r) }
        }
      end

      # The delivered purchases this buyer can still write about, so the UI can
      # prompt them rather than making them guess.
      def pending
        items = Review.reviewable_order_items_for(current_user).includes(:product, :order)

        render json: items.map { |item|
          {
            orderItemId: item.id,
            orderReference: item.order.reference,
            productId: item.product_id,
            productSlug: item.product&.slug,
            productName: item.product_name,
            emoji: item.product&.emoji,
            deliveredAt: item.delivered_at,
          }
        }
      end

      def create
        item = OrderItem.joins(:order)
                        .where(orders: { buyer_id: current_user.id })
                        .find(params[:order_item_id])

        review = Review.new(
          product_id: item.product_id,
          buyer: current_user,
          order_item: item,
          rating: params[:rating],
          title: params[:title],
          body: params[:body],
        )

        if review.save
          render json: ReviewSerializer.render(review), status: :created
        else
          render json: { message: review.errors.full_messages.to_sentence,
                         errors: review.errors.to_hash }, status: :unprocessable_entity
        end
      end
    end
  end
end
