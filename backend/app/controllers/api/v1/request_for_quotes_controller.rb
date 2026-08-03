module Api
  module V1
    class RequestForQuotesController < ApplicationController
      def create
        request_for_quote = RequestForQuote.create!(request_for_quote_params)

        render json: RequestForQuoteSerializer.render(request_for_quote), status: :created
      end

      private
        def request_for_quote_params
          params.require(:request_for_quote).permit(
            :company_name,
            :contact_name,
            :email,
            :country,
            :product_interest,
            :estimated_quantity,
            :specifications,
          )
        end
    end
  end
end
