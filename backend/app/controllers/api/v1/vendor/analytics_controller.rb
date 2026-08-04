module Api
  module V1
    module Vendor
      class AnalyticsController < BaseController
        DEFAULT_WINDOW_DAYS = 30
        LOW_STOCK_THRESHOLD = 10

        def show
          days = [ [ params.fetch(:days, DEFAULT_WINDOW_DAYS).to_i, 1 ].max, 365 ].min
          since = days.days.ago.beginning_of_day

          sold = OrderItem.joins(:order)
                          .where(vendor: current_vendor, orders: { status: Order::SETTLED_STATUSES })

          in_window = sold.where(orders: { created_at: since.. })

          render json: {
            windowDays: days,
            revenueCents: in_window.sum(:line_total_cents),
            netCents: in_window.sum(:net_cents),
            unitsSold: in_window.sum(:quantity),
            orderCount: in_window.distinct.count(:order_id),
            averageOrderCents: average_order_cents(in_window),
            daily: daily_series(in_window, since, days),
            topProducts: top_products(in_window),
            fulfillment: fulfillment_breakdown,
            lowStock: low_stock,
            rating: rating_summary
          }
        end

        private

        def average_order_cents(scope)
          orders = scope.distinct.count(:order_id)
          return 0 if orders.zero?

          (scope.sum(:line_total_cents).to_f / orders).round
        end

        # A dense series with a zero for every quiet day, so the chart does not
        # silently compress gaps in trading.
        def daily_series(scope, since, days)
          totals = scope.group(Arel.sql("DATE(orders.created_at)")).sum(:line_total_cents)
          units = scope.group(Arel.sql("DATE(orders.created_at)")).sum(:quantity)

          (0...days).map do |offset|
            date = (since + offset.days).to_date
            {
              date: date.iso8601,
              revenueCents: totals[date].to_i,
              units: units[date].to_i
            }
          end
        end

        def top_products(scope)
          rows = scope.group(:product_id)
                      .select("product_id, SUM(quantity) AS units, SUM(line_total_cents) AS revenue")
                      .order(Arel.sql("SUM(line_total_cents) DESC"))
                      .limit(5)

          products = Product.where(id: rows.map(&:product_id)).index_by(&:id)

          rows.map do |row|
            product = products[row.product_id]
            {
              productId: row.product_id,
              name: product&.name,
              slug: product&.slug,
              emoji: product&.emoji,
              units: row.units.to_i,
              revenueCents: row.revenue.to_i
            }
          end
        end

        # What the vendor still owes the buyer: anything not yet delivered.
        def fulfillment_breakdown
          counts = OrderItem.joins(:order)
                            .where(vendor: current_vendor, orders: { status: Order::SETTLED_STATUSES })
                            .group(:fulfillment_status)
                            .count

          OrderItem::FULFILLMENT_STATUSES.keys.to_h { |status| [ status, counts[status.to_s].to_i ] }
        end

        def low_stock
          current_vendor.products
                        .where(status: :active)
                        .where(stock: ..LOW_STOCK_THRESHOLD)
                        .order(:stock)
                        .map { |p| ProductSerializer.render(p) }
        end

        def rating_summary
          rated = current_vendor.products.where.not(rating: nil)

          {
            average: rated.average(:rating)&.to_f&.round(2),
            reviewCount: current_vendor.products.sum(:reviews_count)
          }
        end
      end
    end
  end
end
