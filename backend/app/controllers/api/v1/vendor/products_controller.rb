module Api
  module V1
    module Vendor
      class ProductsController < BaseController
        def index
          products = current_vendor.products.includes(:category, :price_tiers).order(created_at: :desc)
          render json: products.map { |p| ProductSerializer.render(p) }
        end

        def create
          product = current_vendor.products.new(product_params)
          product.status = :active unless product_params.key?(:status)

          if product.save
            replace_price_tiers(product)
            render json: ProductSerializer.render(product.reload), status: :created
          else
            render json: { message: product.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def update
          product = current_vendor.products.find(params[:id])
          if product.update(product_params)
            replace_price_tiers(product)
            render json: ProductSerializer.render(product.reload)
          else
            render json: { message: product.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def destroy
          product = current_vendor.products.find(params[:id])
          if product.destroy
            head :no_content
          else
            render json: { message: product.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        private

        def product_params
          params.permit(:name, :category_id, :description, :price_cents, :stock, :emoji, :origin,
                        :status, :free_shipping, :moq, :unit_of_measure, :lead_time_days,
                        :packaging, :sample_available, :sample_price_cents)
        end

        # Tiers are sent whole rather than patched one by one — a vendor edits
        # their volume breaks as a set, and replacing avoids orphaned rows.
        def replace_price_tiers(product)
          return unless params.key?(:price_tiers)

          tiers = Array(params[:price_tiers]).filter_map do |tier|
            min = (tier[:min_quantity] || tier["min_quantity"]).to_i
            price = (tier[:unit_price_cents] || tier["unit_price_cents"]).to_i
            next if min <= 0 || price <= 0

            { min_quantity: min, unit_price_cents: price }
          end

          product.price_tiers.destroy_all
          tiers.uniq { |t| t[:min_quantity] }.each { |t| product.price_tiers.create!(t) }
        end
      end
    end
  end
end
