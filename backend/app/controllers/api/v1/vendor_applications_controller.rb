module Api
  module V1
    class VendorApplicationsController < ApplicationController
      before_action :authenticate!

      # The signed-in user's own application, so the UI can show them where it
      # stands instead of letting them apply twice.
      def show
        vendor = current_user.vendor
        return head :no_content unless vendor

        render json: VendorSerializer.render(vendor, include_application: true)
      end

      def create
        if current_user.vendor
          return render json: { message: "You have already applied to sell on AURION." },
                        status: :unprocessable_entity
        end

        vendor = ::Vendor.new(application_params)
        vendor.user = current_user
        vendor.status = :pending
        vendor.applied_at = Time.current

        if vendor.save
          render json: VendorSerializer.render(vendor, include_application: true), status: :created
        else
          render json: { message: vendor.errors.full_messages.to_sentence,
                         errors: vendor.errors.to_hash }, status: :unprocessable_entity
        end
      end

      private

      # Commission rate is deliberately not accepted: applicants do not get to
      # set their own platform fee.
      def application_params
        params.permit(:store_name, :bio, :contact_name, :contact_phone, :business_registration,
                      :city, :country, :website, :product_focus, :payout_method)
      end
    end
  end
end
