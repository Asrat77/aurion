module Api
  module V1
    class PaymentsController < ApplicationController
      before_action :authenticate!
      before_action :set_order

      def create
        render json: PaymentGateway.for(@order).create_intent
      end

      def mock_confirm
        unless PaymentGateway.for(@order).is_a?(PaymentGateways::MockGateway)
          return render json: { message: "A real payment gateway is configured for this order." }, status: :unprocessable_entity
        end

        @order.mark_paid!(payment_method: "mock")
        render json: OrderSerializer.render(@order.reload)
      end

      private

      def set_order
        @order = current_user.orders.find(params[:order_id])
      end
    end
  end
end
