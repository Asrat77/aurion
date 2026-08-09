module Api
  module V1
    module Webhooks
      class PaymentsController < ApplicationController
        def create
          provider = params[:provider].to_s
          raw_body = request.raw_post
          signature = request.headers["X-Provider-Signature"]
          event = ProtectedPayments::WebhookProcessor.receive!(provider: provider, raw_body: raw_body, signature: signature)
          ProcessProviderEventJob.perform_later(event.id) unless event.processed?
          render json: { id: event.external_event_id, status: event.status }, status: :accepted
        rescue JSON::ParserError
          render json: { message: "Invalid webhook payload." }, status: :unprocessable_entity
        rescue ArgumentError => error
          render json: { message: error.message }, status: :unprocessable_entity
        end
      end
    end
  end
end
