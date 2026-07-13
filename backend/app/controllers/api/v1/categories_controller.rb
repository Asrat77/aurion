module Api
  module V1
    class CategoriesController < ApplicationController
      def index
        categories = Category.order(:name)
        render json: categories.map { |c| CategorySerializer.render(c) }
      end
    end
  end
end
