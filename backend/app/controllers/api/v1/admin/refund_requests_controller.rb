module Api
  module V1
    module Admin
      class RefundRequestsController < BaseController
        def index
          claims = RefundRequest.includes(:buyer, :order, order_item: [ :product, :vendor ])
                                .recent_first
          render json: claims.map { |c| RefundRequestSerializer.render(c, include_buyer: true) }
        end

        def approve
          resolve(:approve!)
        end

        def reject
          resolve(:reject!)
        end

        private

        def resolve(action)
          claim = RefundRequest.find(params[:id])

          if claim.public_send(action, admin: current_user, note: params[:note].presence)
            render json: RefundRequestSerializer.render(claim.reload, include_buyer: true)
          else
            render json: { message: "This claim has already been resolved." },
                   status: :unprocessable_entity
          end
        end
      end
    end
  end
end
