module Api
  module V1
    module Business
      class BaseController < ApplicationController
        before_action :authenticate!
        before_action :require_idempotency_key!, if: :state_changing_request?
        around_action :with_idempotency, if: :state_changing_request?

        private

        def organization_for(id = params[:organization_id] || params[:organization_id_param])
          current_user.organizations.active.find(id)
        end

        def require_transactor!(organization)
          return if organization.transact_as?(current_user)

          render json: { message: "You are not authorized to transact for this organization." }, status: :forbidden
        end

        def require_member!(organization)
          return if organization.member?(current_user)

          render json: { message: "You are not a member of this organization." }, status: :forbidden
        end

        def idempotent_response(resource: nil, status: :created)
          key = request.headers["Idempotency-Key"].presence
          return yield unless key

          scope_key = "user:#{current_user.id}"
          request_hash = Digest::SHA256.hexdigest(request.raw_post.to_s)
          record = IdempotencyRecord.find_by(scope_key: scope_key, key: key)
          if record
            return render json: record.response_body, status: record.response_status if record.same_request?(request_hash)

            return render json: { message: "This idempotency key was already used with a different request." },
                          status: :conflict
          end

          body, response_status = yield
          IdempotencyRecord.create!(scope_key: scope_key, key: key, request_hash: request_hash,
                                    resource_type: resource&.class&.name, resource_id: resource&.id,
                                    response_status: response_status, response_body: body)
          render json: body, status: response_status
        end
      end
    end
  end
end
