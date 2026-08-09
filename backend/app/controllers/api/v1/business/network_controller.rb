module Api
  module V1
    module Business
      # Public reads for the Business storefront: what the network actually
      # contains, and who is in it. Deliberately outside BaseController because
      # a buyer evaluating AURION has not signed in yet.
      class NetworkController < ApplicationController
        def show
          render json: ::Business::NetworkSnapshot.call
        end

        def suppliers
          render json: ::Business::SupplierDirectory.call(
            region: params[:region], category: params[:category], certification: params[:certification],
            verified_only: params[:verified], query: params[:q], limit: params.fetch(:limit, 60)
          )
        end
      end
    end
  end
end
