module Api
  module V1
    module Admin
      class RequestForQuotesController < BaseController
        def index
          request_for_quotes = RequestForQuote.includes(:product).reverse_chronologically

          render json: request_for_quotes.map { |request_for_quote|
            RequestForQuoteSerializer.render(request_for_quote)
          }
        end

        def update
          request_for_quote = RequestForQuote.find(params[:id])

          unless RequestForQuote::STATUSES.include?(params[:status])
            return render json: { message: "Unknown status." }, status: :unprocessable_entity
          end

          if request_for_quote.update(status: params[:status])
            render json: RequestForQuoteSerializer.render(request_for_quote)
          else
            render json: { message: request_for_quote.errors.full_messages.to_sentence },
                   status: :unprocessable_entity
          end
        end

        # Sends a price back to the buyer and moves the request to "quoted".
        def quote
          request_for_quote = RequestForQuote.find(params[:id])

          quoted = request_for_quote.quote!(
            unit_price_cents: params[:quoted_unit_price_cents],
            lead_time_days: params[:quoted_lead_time_days].presence,
            note: params[:quote_note].presence
          )

          if quoted
            render json: RequestForQuoteSerializer.render(request_for_quote)
          else
            render json: { message: request_for_quote.errors.full_messages.to_sentence },
                   status: :unprocessable_entity
          end
        end
      end
    end
  end
end
