module Api
  module V1
    module Business
      class QuotationsController < BaseController
        def index
          buyer_rfq_ids = RequestForQuote.where(organization: current_user.organizations.active).select(:id)
          quotations = Quotation.where(request_for_quote_id: buyer_rfq_ids)
                                .or(Quotation.where(vendor: current_user.vendor))
                                .includes(:request_for_quote, :vendor, :items)
                                .latest_first
          render json: quotations.map { |quotation| QuotationSerializer.render(quotation) }
        end

        def create
          vendor = current_user.vendor
          return render json: { message: "Supplier onboarding is required." }, status: :forbidden unless vendor&.business_ready?

          invitation = vendor.supplier_invitations.find(params[:invitation_id] || params[:opportunity_id])
          return render json: { message: "Not found" }, status: :not_found unless invitation
          return render json: { message: "This opportunity is no longer open." }, status: :unprocessable_entity unless invitation.invited? || invitation.viewed? || invitation.quoted?

          previous = invitation.request_for_quote.quotations.where(vendor: current_user.vendor).order(revision: :desc).first
          quotation = invitation.request_for_quote.quotations.create!(
            vendor: current_user.vendor,
            supersedes: previous,
            revision: previous ? previous.revision + 1 : 1,
            currency: params.fetch(:currency, invitation.request_for_quote.currency),
            incoterm: params[:incoterm],
            lead_time_days: params[:lead_time_days],
            shipping_cents: params.fetch(:shipping_cents, 0),
            valid_until: params[:valid_until],
            note: params[:note]
          )
          Array(params[:items]).each do |item|
            quotation.items.create!(
              product_id: item[:product_id] || item["product_id"],
              description: item[:description] || item["description"],
              quantity: item[:quantity] || item["quantity"],
              unit_price_cents: item[:unit_price_cents] || item["unit_price_cents"],
              currency: quotation.currency
            )
          end
          render json: QuotationSerializer.render(quotation.reload), status: :created
        end

        def update
          quotation = current_user.vendor&.quotations&.find(params[:id])
          return render json: { message: "Not found" }, status: :not_found unless quotation
          return render json: { message: "Submitted quotations cannot be edited." }, status: :unprocessable_entity unless quotation.draft?

          quotation.update!(quotation_params)
          render json: QuotationSerializer.render(quotation.reload)
        end

        def submit
          quotation = current_user.vendor&.quotations&.find(params[:id])
          return render json: { message: "Not found" }, status: :not_found unless quotation

          quotation.submit!
          render json: QuotationSerializer.render(quotation.reload)
        end

        def withdraw
          quotation = current_user.vendor&.quotations&.find(params[:id])
          return render json: { message: "Not found" }, status: :not_found unless quotation

          quotation.withdraw!
          render json: QuotationSerializer.render(quotation.reload)
        end

        def accept
          quotation = Quotation.includes(:request_for_quote, :items, :vendor).find(params[:id])
          organization = current_user.organizations.active.find(params[:organization_id])
          require_transactor!(organization)
          return if performed?
          return render json: { message: "Not found" }, status: :not_found unless organization.buyer? && quotation.request_for_quote.organization_id == organization.id

          trade_order = quotation.accept!(buyer: current_user, organization: organization,
                                          ip_address: request.remote_ip, user_agent: request.user_agent)
          render json: TradeOrderSerializer.render(trade_order), status: :created
        end

        private

        def quotation_params
          params.permit(:incoterm, :lead_time_days, :shipping_cents, :valid_until, :note)
        end
      end
    end
  end
end
