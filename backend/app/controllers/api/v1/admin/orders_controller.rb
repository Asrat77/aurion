module Api
  module V1
    module Admin
      class OrdersController < BaseController
        def index
          orders = Order.includes(:buyer, order_items: [ :product, :vendor ]).order(created_at: :desc)
          render json: orders.map { |o| OrderSerializer.render(o, include_buyer: true) }
        end
      end
    end
  end
end
