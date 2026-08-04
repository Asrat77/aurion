module Api
  module V1
    class RequestForQuotesController < ApplicationController
      def create
        request_for_quote = RequestForQuote.create!(request_for_quote_params)

        render json: RequestForQuoteSerializer.render(request_for_quote), status: :created
      end

      # The wholesale catalogue: products a vendor has put commercial terms on.
      def catalogue
        products = Product.active.wholesale
                          .eager_load(:vendor, :category)
                          .includes(:price_tiers)
                          .order(:moq)

        render json: products.map { |p| ProductSerializer.render(p) }
      end

      private
        def request_for_quote_params
          params.require(:request_for_quote).permit(
            :company_name,
            :contact_name,
            :email,
            :country,
            :product_interest,
            :product_id,
            :estimated_quantity,
            :specifications,
            :incoterm,
            :destination_port,
            :target_price_cents,
            :sample_requested,
          )
        end
    end
  end
end
