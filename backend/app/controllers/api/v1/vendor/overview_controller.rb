module Api
  module V1
    module Vendor
      class OverviewController < BaseController
        def show
          sold_items = OrderItem.joins(:order)
                                 .where(vendor: current_vendor, orders: { status: [ :paid, :fulfilled ] })

          render json: {
            productCount: current_vendor.products.count,
            itemsSold: sold_items.sum(:quantity),
            grossCents: sold_items.sum(:line_total_cents),
            netCents: sold_items.sum(:net_cents),
            commissionRate: current_vendor.commission_rate.to_f,
            products: current_vendor.products.order(:name).map { |p| ProductSerializer.render(p) },
          }
        end
      end
    end
  end
end
