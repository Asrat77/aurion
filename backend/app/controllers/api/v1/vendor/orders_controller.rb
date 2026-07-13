module Api
  module V1
    module Vendor
      class OrdersController < BaseController
        def index
          items = OrderItem.includes(:product, order: :buyer)
                            .where(vendor: current_vendor, orders: { status: [ :paid, :fulfilled ] })
                            .joins(:order)
                            .order("orders.created_at DESC")

          render json: items.map { |i|
            {
              id: i.id,
              orderReference: i.order.reference,
              productName: i.product_name,
              emoji: i.product&.emoji,
              quantity: i.quantity,
              lineTotalCents: i.line_total_cents,
              buyerEmail: i.order.buyer.email,
              createdAt: i.order.created_at,
            }
          }
        end
      end
    end
  end
end
