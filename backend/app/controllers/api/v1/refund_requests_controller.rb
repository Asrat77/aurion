module Api
  module V1
    class RefundRequestsController < ApplicationController
      before_action :authenticate!

      def index
        claims = RefundRequest.where(buyer: current_user)
                              .includes(:order, order_item: :product)
                              .recent_first
        render json: claims.map { |c| RefundRequestSerializer.render(c) }
      end

      def create
        item = OrderItem.joins(:order)
                        .where(orders: { buyer_id: current_user.id })
                        .find(params[:order_item_id])

        claim = RefundRequest.new(
          order: item.order,
          order_item: item,
          buyer: current_user,
          reason: params[:reason],
          detail: params[:detail],
          amount_cents: item.line_total_cents,
        )

        if claim.save
          item.order.record_event!("Refund requested", actor: current_user, order_item: item,
                                                       note: claim.reason.to_s.humanize)
          render json: RefundRequestSerializer.render(claim), status: :created
        else
          render json: { message: claim.errors.full_messages.to_sentence,
                         errors: claim.errors.to_hash }, status: :unprocessable_entity
        end
      rescue ArgumentError
        render json: { message: "Choose a valid reason for the refund." }, status: :unprocessable_entity
      end
    end
  end
end
