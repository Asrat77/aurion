module Api
  module V1
    module Admin
      class VendorsController < BaseController
        def index
          vendors = ::Vendor.includes(:products).order(:store_name)

          render json: vendors.map { |v|
            revenue_cents = OrderItem.joins(:order)
                                      .where(vendor: v, orders: { status: Order::SETTLED_STATUSES })
                                      .sum(:line_total_cents)
            {
              id: v.id,
              storeName: v.store_name,
              slug: v.slug,
              status: v.status,
              commissionRate: v.commission_rate.to_f,
              productCount: v.products.size,
              revenueCents: revenue_cents,
            }
          }
        end
      end
    end
  end
end
