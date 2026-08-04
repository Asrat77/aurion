module Api
  module V1
    module Admin
      class ReviewsController < BaseController
        def index
          reviews = Review.includes(:buyer, :product).recent_first
          render json: reviews.map { |r| ReviewSerializer.render(r) }
        end

        # Moderation is a straight publish/hide toggle — enough to take down
        # abuse without holding honest reviews in a queue.
        def update
          review = Review.find(params[:id])

          if review.update(status: params[:status])
            render json: ReviewSerializer.render(review)
          else
            render json: { message: review.errors.full_messages.to_sentence },
                   status: :unprocessable_entity
          end
        end
      end
    end
  end
end
