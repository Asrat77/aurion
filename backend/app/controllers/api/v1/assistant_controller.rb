module Api
  module V1
    class AssistantController < ApplicationController
      # The assistant answers public catalogue questions too, so a session is
      # optional. Anything user-specific is scoped to current_user inside the
      # context builder, which is nil for a visitor.
      def show
        render json: AiAssistant::Configuration.status
      end

      def create
        question = params[:question].to_s.strip
        return render json: { message: "Ask a question first." }, status: :unprocessable_entity if question.blank?

        exchange = AiAssistant::Responder.new(
          task: params[:task], question: question, channel: params[:channel],
          conversation_key: params[:conversation_key], user: current_user,
          history: history_param
        ).call

        render json: {
          id: exchange.id,
          conversationKey: exchange.conversation_key,
          answer: exchange.answer,
          model: exchange.model,
          provider: exchange.provider,
          groundedOn: exchange.grounding,
          latencyMs: exchange.latency_ms
        }
      rescue AiAssistant::Responder::Disabled => error
        render json: { message: error.message, enabled: false }, status: :service_unavailable
      rescue AiAssistant::Responder::RateLimited => error
        render json: { message: error.message }, status: :too_many_requests
      rescue StandardError
        # Never dress a provider failure up as an answer.
        render json: { message: "The assistant could not answer right now. Please try again." },
               status: :bad_gateway
      end

      private

      def history_param
        params.permit(history: [ :role, :content ])[:history]&.map(&:to_h) || []
      end
    end
  end
end
