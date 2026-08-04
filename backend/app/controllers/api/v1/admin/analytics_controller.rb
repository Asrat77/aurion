module Api
  module V1
    module Admin
      class AnalyticsController < BaseController
        def show
          paid_orders = Order.settled
          total_orders = paid_orders.count
          total_revenue_cents = paid_orders.sum(:total_cents)
          avg_order_cents = total_orders > 0 ? (total_revenue_cents.to_f / total_orders).round : 0

          top_row = OrderItem.joins(:order)
                              .where(orders: { status: Order::SETTLED_STATUSES })
                              .group(:product_id)
                              .order(Arel.sql("SUM(quantity) DESC"))
                              .sum(:quantity)
                              .first

          top_product_name = nil
          top_product_qty = 0
          if top_row
            top_product_name = Product.find_by(id: top_row[0])&.name
            top_product_qty = top_row[1]
          end

          render json: {
            totalRevenueCents: total_revenue_cents,
            avgOrderCents: avg_order_cents,
            totalOrders: total_orders,
            topProductName: top_product_name,
            topProductQty: top_product_qty,
          }
        end
      end
    end
  end
end
