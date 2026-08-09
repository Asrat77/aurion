module Api
  module V1
    module Business
      class OrganizationsController < BaseController
        def index
          render json: current_user.organizations.active.map { |organization|
            OrganizationSerializer.render(organization, include_memberships: true)
          }
        end

        def show
          organization = current_user.organizations.active.find(params[:id])
          render json: OrganizationSerializer.render(organization, include_memberships: true)
        end

        def create
          return render json: { message: "Only buyer organizations can be created from this workspace." }, status: :unprocessable_entity unless organization_params[:kind].to_s == "buyer"

          organization = nil
          Organization.transaction do
            organization = Organization.create!(organization_params)
            organization.memberships.create!(user: current_user, role: :owner)
          end
          render json: OrganizationSerializer.render(organization, include_memberships: true), status: :created
        end

        private

        def organization_params
          params.require(:organization).permit(:name, :legal_name, :kind, :registration_number, :country)
        end
      end
    end
  end
end
