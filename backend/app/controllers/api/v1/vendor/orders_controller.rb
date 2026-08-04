module Api
  module V1
    module Vendor
      class OrdersController < BaseController
        def index
          items = OrderItem.includes(:product, order: :buyer)
                            .where(vendor: current_vendor, orders: { status: Order::SETTLED_STATUSES })
                            .joins(:order)
                            .order("orders.created_at DESC")

          render json: items.map { |i| VendorOrderItemSerializer.render(i) }
        end

        # Moves this vendor's own line along the fulfilment timeline. Scoped to
        # the vendor's items, so one vendor can never advance another's.
        def update
          item = OrderItem.where(vendor: current_vendor).find(params[:id])
          order = item.order

          moved = order.advance_item!(
            item,
            params[:fulfillment_status],
            actor: current_user,
            carrier: params[:carrier],
            tracking_number: params[:tracking_number],
          )

          if moved
            render json: VendorOrderItemSerializer.render(item.reload)
          else
            render json: { message: order.transition_error }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
