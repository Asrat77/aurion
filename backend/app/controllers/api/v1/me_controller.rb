module Api
  module V1
    class MeController < ApplicationController
      before_action :authenticate!

      def show
        render json: UserSerializer.render(current_user)
      end

      def update
        if current_user.update(user_params)
          render json: UserSerializer.render(current_user)
        else
          render json: { message: current_user.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy
        current_user.destroy
        sign_out
        head :no_content
      end

      private

      def user_params
        params.permit(:name, :email, :phone)
      end
    end
  end
end
