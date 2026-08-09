module Api
  module V1
    module Vendor
      class PayoutsController < BaseController
        def index
          payouts = Payout.includes(order_item: :order).where(vendor: current_vendor).order(created_at: :desc)

          gross_cents = OrderItem.joins(:order)
                                  .where(vendor: current_vendor, orders: { status: Order::SETTLED_STATUSES })
                                  .sum(:line_total_cents)
          commission_cents = OrderItem.joins(:order)
                                       .where(vendor: current_vendor, orders: { status: Order::SETTLED_STATUSES })
                                       .sum(:commission_cents)
          net_cents = gross_cents - commission_cents

          render json: {
            grossCents: gross_cents,
            commissionCents: commission_cents,
            netCents: net_cents,
            payouts: payouts.map { |p| PayoutSerializer.render(p) }
          }
        end
      end
    end
  end
end
