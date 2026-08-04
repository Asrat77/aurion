module Api
  module V1
    module Admin
      class OrdersController < BaseController
        def index
          orders = Order.includes(:buyer, :order_events, order_items: [ :product, :vendor ])
                         .order(created_at: :desc)
          render json: orders.map { |o| OrderSerializer.render(o, include_buyer: true) }
        end

        # Admin intervention: step in when a buyer and vendor cannot resolve an
        # order between themselves.
        def cancel
          order = Order.find(params[:id])

          if order.cancel!(actor: current_user, note: params[:note].presence || "Cancelled by admin")
            render json: OrderSerializer.render(order.reload, include_buyer: true)
          else
            render json: { message: order.transition_error }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
