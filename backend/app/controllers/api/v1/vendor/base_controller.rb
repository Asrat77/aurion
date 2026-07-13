module Api
  module V1
    module Vendor
      class BaseController < ApplicationController
        before_action :require_vendor

        private

        def require_vendor
          require_role(:vendor)
          return if performed?

          @current_vendor = current_user.vendor
          unless @current_vendor
            render json: { message: "No vendor profile found for this account." }, status: :forbidden
          end
        end

        attr_reader :current_vendor
      end
    end
  end
end
