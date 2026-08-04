module Api
  module V1
    class OrdersController < ApplicationController
      before_action :authenticate!

      def index
        orders = current_user.orders
                              .includes(:order_events, order_items: [ :product, :vendor ])
                              .order(created_at: :desc)
        render json: orders.map { |o| OrderSerializer.render(o) }
      end

      def show
        order = current_user.orders
                             .includes(:order_events, order_items: [ :product, :vendor ])
                             .find(params[:id])
        render json: OrderSerializer.render(order)
      end

      # Prices a prospective cart without creating anything, so checkout can show
      # shipping, VAT and the buyer's currency before they commit.
      def quote
        lines, error = resolve_lines(check_stock: false)
        return render json: { message: error }, status: :unprocessable_entity if error

        render json: Pricing.quote(lines: lines, country: params[:country]).to_h
      end

      def create
        lines, error = resolve_lines(check_stock: true)
        return render json: { message: error }, status: :unprocessable_entity if error

        quote = Pricing.quote(lines: lines, country: params[:country])
        order = nil

        ActiveRecord::Base.transaction do
          order = Order.create!(
            buyer: current_user,
            status: :pending,
            subtotal_cents: quote.subtotal_cents,
            shipping_cents: quote.shipping_cents,
            tax_cents: quote.tax_cents,
            total_cents: quote.total_cents,
            currency: quote.currency,
            fx_rate: quote.fx_rate,
            shipping_address: shipping_address_params,
          )

          lines.each do |product, qty|
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

          order.record_event!(:pending, actor: current_user, note: "Order placed")
        end

        render json: OrderSerializer.render(order), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.message }, status: :unprocessable_entity
      end

      # A buyer may call off their own order until a vendor has shipped it.
      def cancel
        order = current_user.orders.find(params[:id])

        if order.cancel!(actor: current_user, note: "Cancelled by buyer")
          render json: OrderSerializer.render(order.reload)
        else
          render json: { message: order.transition_error }, status: :unprocessable_entity
        end
      end

      private

      # Turns the posted cart into [product, quantity] pairs, rejecting anything
      # that is missing, unavailable or out of stock. Returns [lines, error].
      def resolve_lines(check_stock:)
        items_param = Array(params[:items])
        return [ nil, "Your cart is empty." ] if items_param.blank?

        quantities_by_id = items_param.each_with_object({}) do |i, acc|
          acc[(i[:product_id] || i["product_id"]).to_i] = (i[:quantity] || i["quantity"]).to_i
        end

        products = Product.active.where(id: quantities_by_id.keys).includes(:vendor)
        if products.count != quantities_by_id.keys.uniq.count
          return [ nil, "One or more products are no longer available." ]
        end

        lines = products.map { |product| [ product, quantities_by_id[product.id] ] }

        lines.each do |product, qty|
          return [ nil, "Invalid quantity for #{product.name}." ] if qty <= 0
          if check_stock && product.stock < qty
            return [ nil, "Not enough stock for #{product.name}. Only #{product.stock} left." ]
          end
        end

        [ lines, nil ]
      end

      def shipping_address_params
        params.fetch(:shipping_address, ActionController::Parameters.new).permit(
          :first, :last, :email, :address, :city, :country, :zip, :phone
        ).to_h
      end
    end
  end
end
