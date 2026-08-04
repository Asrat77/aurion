module Api
  module V1
    module Admin
      class VendorApplicationsController < BaseController
        def index
          applications = ::Vendor.applications.includes(:user).order(applied_at: :desc)
          render json: applications.map { |v| VendorSerializer.render(v, include_application: true) }
        end

        def approve
          resolve(:approve!)
        end

        def reject
          resolve(:reject!)
        end

        private

        def resolve(action)
          vendor = ::Vendor.find(params[:id])

          if vendor.public_send(action, admin: current_user, note: params[:note].presence)
            render json: VendorSerializer.render(vendor.reload, include_application: true)
          else
            render json: { message: "This application has already been decided." },
                   status: :unprocessable_entity
          end
        end
      end
    end
  end
end
