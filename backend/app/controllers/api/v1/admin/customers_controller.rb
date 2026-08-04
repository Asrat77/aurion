module Api
  module V1
    module Admin
      class CustomersController < BaseController
        def index
          rows = Order.settled
                       .joins(:buyer)
                       .group("users.id", "users.email")
                       .select("users.id AS user_id, users.email AS email, COUNT(orders.id) AS orders_count, SUM(orders.total_cents) AS total_cents")
                       .order("total_cents DESC")

          render json: rows.map { |r|
            { email: r.email, orders: r.orders_count.to_i, totalCents: r.total_cents.to_i }
          }
        end
      end
    end
  end
end
