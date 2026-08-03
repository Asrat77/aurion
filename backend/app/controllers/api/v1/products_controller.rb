module Api
  module V1
    class ProductsController < ApplicationController
      def index
        scope = Product.active.eager_load(:vendor, :category)

        if params[:category].present?
          scope = scope.joins(:category).where(categories: { slug: params[:category] })
        end

        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where(
            "LOWER(products.name) LIKE :q OR LOWER(products.description) LIKE :q OR LOWER(products.origin) LIKE :q",
            q: q
          )
        end

        scope = case params[:sort]
        when "price_asc" then scope.order(price_cents: :asc)
        when "price_desc" then scope.order(price_cents: :desc)
        when "name" then scope.order(name: :asc)
        else scope.order(Arel.sql("rating DESC NULLS LAST"))
        end

        page = [ params.fetch(:page, 1).to_i, 1 ].max
        per = [ params.fetch(:per, 24).to_i, 100 ].min
        total = scope.count
        products = scope.offset((page - 1) * per).limit(per)

        render json: {
          products: products.map { |p| ProductSerializer.render(p) },
          meta: { total: total, page: page, per: per }
        }
      end

      def show
        product = Product.active.eager_load(:vendor, :category).find_by!(slug: params[:slug])
        render json: ProductSerializer.render(product)
      end
    end
  end
end
