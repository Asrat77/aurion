module Api
  module V1
    module Business
      class MembershipsController < BaseController
        before_action :set_organization
        before_action :require_owner!, only: [ :create, :update, :destroy ]

        def index
          render json: @organization.memberships.includes(:user).map { |membership| serialize(membership) }
        end

        def create
          user = find_user
          return render json: { message: "User not found." }, status: :not_found unless user

          membership = @organization.memberships.create!(user: user, role: membership_params.fetch(:role, "buyer"))
          render json: serialize(membership), status: :created
        end

        def update
          membership = @organization.memberships.find(params[:id])
          attributes = membership_params.slice(:role, :status).compact
          membership.update!(attributes)
          render json: serialize(membership.reload)
        end

        def destroy
          membership = @organization.memberships.find(params[:id])
          return render json: { message: "The organization owner cannot be removed." }, status: :unprocessable_entity if membership.role == "owner"

          membership.update!(status: :suspended)
          render json: serialize(membership.reload)
        end

        private

        def set_organization
          @organization = current_user.organizations.active.find(params[:organization_id])
        end

        def require_owner!
          return if @organization.memberships.active.exists?(user: current_user, role: :owner)

          render json: { message: "Only an organization owner may manage memberships." }, status: :forbidden
        end

        def membership_params
          raw = params[:membership] || {}
          {
            email: raw[:email] || raw["email"],
            user_id: raw[:user_id] || raw["user_id"],
            role: raw[:role] || raw["role"],
            status: raw[:status] || raw["status"]
          }.compact
        end

        def find_user
          attributes = membership_params
          attributes[:user_id].present? ? User.find_by(id: attributes[:user_id]) : User.find_by(email: attributes[:email].to_s.downcase.strip)
        end

        def serialize(membership)
          { id: membership.id, userId: membership.user_id, name: membership.user.name,
            email: membership.user.email, role: membership.role, status: membership.status }
        end
      end
    end
  end
end
