module Api
  module V1
    module Vendor
      class ProductsController < BaseController
        def index
          products = current_vendor.products.includes(:category).order(created_at: :desc)
          render json: products.map { |p| ProductSerializer.render(p) }
        end

        def create
          product = current_vendor.products.new(product_params)
          product.status = :active unless product_params.key?(:status)
          if product.save
            render json: ProductSerializer.render(product), status: :created
          else
            render json: { message: product.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def update
          product = current_vendor.products.find(params[:id])
          if product.update(product_params)
            render json: ProductSerializer.render(product)
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
          params.permit(:name, :category_id, :description, :price_cents, :stock, :emoji, :origin, :status)
        end
      end
    end
  end
end
