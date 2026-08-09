module Api
  module V1
    module Admin
      class OrganizationsController < BaseController
        def index
          organizations = Organization.includes(:memberships, :vendors).order(created_at: :desc)
          render json: organizations.map { |organization| OrganizationSerializer.render(organization, include_memberships: true) }
        end

        def verify
          organization = Organization.find(params[:id])
          organization.verify!(admin: current_user)
          render json: OrganizationSerializer.render(organization.reload, include_memberships: true)
        end
      end
    end
  end
end
