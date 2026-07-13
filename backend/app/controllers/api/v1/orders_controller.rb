module Api
  module V1
    class OrdersController < ApplicationController
      before_action :authenticate!

      SHIPPING_CENTS = 500
      TAX_RATE = 0.08

      def index
        orders = current_user.orders.includes(order_items: [ :product, :vendor ]).order(created_at: :desc)
        render json: orders.map { |o| OrderSerializer.render(o) }
      end

      def show
        order = current_user.orders.includes(order_items: [ :product, :vendor ]).find(params[:id])
        render json: OrderSerializer.render(order)
      end

      def create
        items_param = Array(params[:items])
        if items_param.blank?
          return render json: { message: "Your cart is empty." }, status: :unprocessable_entity
        end

        product_ids = items_param.map { |i| i[:product_id] || i["product_id"] }
        quantities_by_id = items_param.each_with_object({}) do |i, acc|
          acc[(i[:product_id] || i["product_id"]).to_i] = (i[:quantity] || i["quantity"]).to_i
        end

        products = Product.active.where(id: product_ids).includes(:vendor)
        if products.count != product_ids.uniq.count
          return render json: { message: "One or more products are no longer available." }, status: :unprocessable_entity
        end

        products.each do |product|
          qty = quantities_by_id[product.id]
          if qty.to_i <= 0
            return render json: { message: "Invalid quantity for #{product.name}." }, status: :unprocessable_entity
          end
          if product.stock < qty
            return render json: { message: "Not enough stock for #{product.name}. Only #{product.stock} left." }, status: :unprocessable_entity
          end
        end

        country = params[:country].to_s
        currency = country == "ET" ? "ETB" : "USD"
        fx_rate = country == "ET" ? ENV.fetch("ETB_PER_USD", 140).to_f : 1.0

        order = nil

        ActiveRecord::Base.transaction do
          subtotal_cents = products.sum { |p| p.price_cents * quantities_by_id[p.id] }
          shipping_cents = subtotal_cents > 0 ? SHIPPING_CENTS : 0
          tax_cents = (subtotal_cents * TAX_RATE).round
          total_cents = subtotal_cents + shipping_cents + tax_cents

          order = Order.create!(
            buyer: current_user,
            status: :pending,
            subtotal_cents: subtotal_cents,
            shipping_cents: shipping_cents,
            tax_cents: tax_cents,
            total_cents: total_cents,
            currency: currency,
            fx_rate: fx_rate,
            shipping_address: shipping_address_params,
          )

          products.each do |product|
            qty = quantities_by_id[product.id]
            line_total = product.price_cents * qty
            commission = (line_total * product.vendor.commission_rate).round

            order.order_items.create!(
              product: product,
              vendor: product.vendor,
              product_name: product.name,
              unit_price_cents: product.price_cents,
              quantity: qty,
              line_total_cents: line_total,
              commission_cents: commission,
              net_cents: line_total - commission,
            )

            product.decrement!(:stock, qty)
          end
        end

        render json: OrderSerializer.render(order), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.message }, status: :unprocessable_entity
      end

      private

      def shipping_address_params
        params.fetch(:shipping_address, ActionController::Parameters.new).permit(
          :first, :last, :email, :address, :city, :country, :zip, :phone
        ).to_h
      end
    end
  end
end
