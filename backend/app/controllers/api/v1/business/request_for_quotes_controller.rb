module Api
  module V1
    module Business
      class RequestForQuotesController < BaseController
        def index
          organizations = current_user.organizations.active
          rfqs = RequestForQuote.where(organization: organizations).includes(:product, :items, :supplier_invitations)
                                 .reverse_chronologically
          render json: rfqs.map { |rfq| render_rfq(rfq) }
        end

        def show
          rfq = RequestForQuote.includes(:product, :items, :supplier_invitations, :quotations).find(params[:id])
          if buyer_can_access?(rfq)
            return render json: render_rfq(rfq, perspective: :buyer)
          end
          return render json: render_rfq(rfq, perspective: :supplier) if supplier_can_access?(rfq)

          render json: { message: "Not found" }, status: :not_found
        end

        def create
          organization = current_user.organizations.active.find(params[:organization_id])
          return render json: { message: "A buyer organization is required." }, status: :unprocessable_entity unless organization.buyer?

          require_transactor!(organization)
          return if performed?

          rfq = organization.request_for_quotes.create!(rfq_params.merge(buyer: current_user))
          create_items(rfq)
          render json: render_rfq(rfq), status: :created
        end

        def publish
          rfq = RequestForQuote.find(params[:id])
          organization = rfq.organization
          return render json: { message: "Not found" }, status: :not_found unless organization&.active? && organization.buyer? && organization.member?(current_user)

          require_transactor!(organization)
          return if performed?
          return render json: { message: "The organization must be verified before publishing an RFQ." }, status: :unprocessable_entity unless organization.verified?

          rfq.publish!(actor: current_user)
          invitations = rfq.invite_suppliers!
          render json: render_rfq(rfq.reload).merge(invitations: invitations.map { |invitation|
            SupplierInvitationSerializer.render(rfq.supplier_invitations.find_by(vendor: invitation.vendor))
          })
        end

        private

        def rfq_params
          params.require(:request_for_quote).permit(
            :company_name, :contact_name, :email, :country, :product_interest, :product_id,
            :estimated_quantity, :specifications, :incoterm, :destination_port,
            :target_price_cents, :sample_requested, :inspection_required, :currency
          )
        end

        def item_params
          params.permit(items: [ :product_id, :description, :quantity, :unit_of_measure, :specifications ])[:items] || []
        end

        def create_items(rfq)
          rows = item_params
          rows = [ { product_id: rfq.product_id, description: rfq.product_interest, quantity: rfq.estimated_quantity.to_s[/\d[\d,]*/].to_s.delete(",").to_i, specifications: rfq.specifications } ] if rows.empty? && rfq.product_id.present?
          rows.each do |row|
            rfq.items.create!(row.merge(description: row[:description].presence || rfq.product_interest,
                                         quantity: row[:quantity].to_i.positive? ? row[:quantity].to_i : 1))
          end
        end

        def buyer_can_access?(rfq)
          rfq.organization.present? && rfq.organization.member?(current_user)
        end

        def supplier_can_access?(rfq)
          current_user.vendor&.business_ready? && rfq.supplier_invitations.exists?(vendor: current_user.vendor)
        end

        def render_rfq(rfq, perspective: :buyer)
          invitations = perspective == :buyer ? rfq.supplier_invitations : rfq.supplier_invitations.where(vendor: current_user.vendor)
          quotations = perspective == :buyer ? rfq.quotations : rfq.quotations.where(vendor: current_user.vendor)
          RequestForQuoteSerializer.render(rfq).merge(
            organizationId: rfq.organization_id,
            buyerId: rfq.buyer_id,
            currency: rfq.currency,
            items: rfq.items.map { |item|
              { id: item.id, productId: item.product_id, description: item.description,
                quantity: item.quantity, unitOfMeasure: item.unit_of_measure, specifications: item.specifications }
            },
            invitations: invitations.map { |invitation| SupplierInvitationSerializer.render(invitation) },
            quotations: quotations.includes(:vendor, :items).latest_first.map { |quotation|
              QuotationSerializer.render(quotation)
            }
          )
        end
      end
    end
  end
end
