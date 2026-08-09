module Api
  module V1
    class PaymentsController < ApplicationController
      before_action :authenticate!
      before_action :set_order

      def create
        gateway = PaymentGateway.for(@order)
        return render json: { message: "A live retail payment provider is not configured." }, status: :service_unavailable unless gateway.available?

        render json: gateway.create_intent
      end

      def mock_confirm
        gateway = PaymentGateway.for(@order)
        unless gateway.is_a?(PaymentGateways::MockGateway) && gateway.available?
          return render json: { message: "Mock payment confirmation is disabled outside staging." }, status: :service_unavailable
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
