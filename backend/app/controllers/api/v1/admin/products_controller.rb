module Api
  module V1
    module Admin
      class ProductsController < BaseController
        def index
          products = Product.includes(:vendor, :category).order(created_at: :desc)
          render json: products.map { |p| ProductSerializer.render(p) }
        end
      end
    end
  end
end
