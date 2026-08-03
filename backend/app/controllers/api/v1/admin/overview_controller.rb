module Api
  module V1
    module Admin
      class OverviewController < BaseController
        def show
          paid_orders = Order.where(status: [ :paid, :fulfilled ])

          render json: {
            totalProducts: Product.count,
            totalOrders: paid_orders.count,
            totalRevenueCents: paid_orders.sum(:total_cents),
            totalCustomers: paid_orders.distinct.count(:buyer_id),
            totalRfqs: RequestForQuote.count,
            recentOrders: paid_orders.includes(:buyer, order_items: [ :product, :vendor ]).order(created_at: :desc).limit(5).map { |o|
              OrderSerializer.render(o, include_buyer: true)
            }
          }
        end
      end
    end
  end
end
