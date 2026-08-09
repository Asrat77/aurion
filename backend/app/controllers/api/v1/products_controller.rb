module Api
  module V1
    class ProductsController < ApplicationController
      MAX_PER_PAGE = 100
      DEFAULT_PER_PAGE = 24

      SORTS = {
        "price_asc" => { price_cents: :asc },
        "price_desc" => { price_cents: :desc },
        "name" => { name: :asc },
        "newest" => { created_at: :desc }
      }.freeze

      def index
        scope = filtered_scope
        scope = apply_sort(scope)

        page = [ params.fetch(:page, 1).to_i, 1 ].max
        per = [ [ params.fetch(:per, DEFAULT_PER_PAGE).to_i, 1 ].max, MAX_PER_PAGE ].min
        total = scope.count
        products = scope.offset((page - 1) * per).limit(per)

        render json: {
          products: products.map { |p| ProductSerializer.render(p) },
          meta: {
            total: total,
            page: page,
            per: per,
            pages: (total.to_f / per).ceil
          }
        }
      end

      # The values the filter UI offers. Derived from the catalogue rather than
      # hardcoded, so a new origin appears in the filter the moment a vendor
      # lists something from there.
      def facets
        active = channel_scope(Product.active)

        render json: {
          origins: active.where.not(origin: [ nil, "" ]).distinct.order(:origin).pluck(:origin),
          priceRange: {
            minCents: active.minimum(:price_cents).to_i,
            maxCents: active.maximum(:price_cents).to_i
          },
          freeShippingCount: active.where(free_shipping: true).count,
          inStockCount: active.in_stock.count
        }
      end

      def show
        product = channel_scope(Product.active).eager_load(:vendor, :category).find_by!(slug: params[:slug])
        render json: ProductSerializer.render(product)
      end

      private

      def filtered_scope
        scope = channel_scope(Product.active.eager_load(:vendor, :category))

        scope = scope.where(categories: { slug: params[:category] }) if params[:category].present?

        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where(
            "LOWER(products.name) LIKE :q OR LOWER(products.description) LIKE :q OR LOWER(products.origin) LIKE :q",
            q: q
          )
        end

        scope = scope.where(origin: Array(params[:origin])) if params[:origin].present?
        scope = scope.where("products.price_cents >= ?", params[:min_price].to_i) if params[:min_price].present?
        scope = scope.where("products.price_cents <= ?", params[:max_price].to_i) if params[:max_price].present?
        scope = scope.where("products.rating >= ?", params[:min_rating].to_f) if params[:min_rating].present?
        scope = scope.in_stock if truthy?(params[:in_stock])
        scope = scope.where(free_shipping: true) if truthy?(params[:free_shipping])
        scope = scope.where(vendors: { slug: params[:vendor] }) if params[:vendor].present?

        scope
      end

      def channel_scope(scope)
        params[:channel].to_s == "business" ? scope.for_business : scope.for_express
      end

      # Rating sorts last with NULLS LAST so unrated products do not lead the
      # default listing.
      def apply_sort(scope)
        order = SORTS[params[:sort]]
        return scope.order(order) if order

        scope.order(Arel.sql("products.rating DESC NULLS LAST"), created_at: :desc)
      end

      def truthy?(value)
        ActiveModel::Type::Boolean.new.cast(value).present?
      end
    end
  end
end
