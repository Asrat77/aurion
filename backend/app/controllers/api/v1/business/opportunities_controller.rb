module Api
  module V1
    module Business
      class OpportunitiesController < BaseController
        def index
          vendor = current_user.vendor
          return render json: { message: "Supplier onboarding is required." }, status: :forbidden unless vendor&.business_ready?

          invitations = vendor.supplier_invitations.includes(request_for_quote: [ :organization, :items ]).order(invited_at: :desc)
          render json: invitations.map { |invitation| SupplierInvitationSerializer.render(invitation) }
        end

        def show
          invitation = current_user.vendor&.supplier_invitations&.includes(request_for_quote: [ :organization, :items ])&.find(params[:id])
          return render json: { message: "Not found" }, status: :not_found unless invitation

          render json: SupplierInvitationSerializer.render(invitation.reload).merge(
            requestForQuote: RequestForQuoteSerializer.render(invitation.request_for_quote)
          )
        end
      end
    end
  end
end
