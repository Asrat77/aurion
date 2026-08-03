module Api
  module V1
    module Admin
      class RequestForQuotesController < BaseController
        def index
          request_for_quotes = RequestForQuote.reverse_chronologically

          render json: request_for_quotes.map { |request_for_quote|
            RequestForQuoteSerializer.render(request_for_quote)
          }
        end
      end
    end
  end
end
