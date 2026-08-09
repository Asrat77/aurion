module Api
  module V1
    class SecurityController < ApplicationController
      def csrf
        render json: { csrfToken: csrf_token }
      end
    end
  end
end
