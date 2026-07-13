module Api
  module V1
    class AuthController < ApplicationController
      def register
        user = User.new(
          email: params[:email],
          password: params[:password],
          name: params[:name],
        )

        if user.save
          sign_in(user)
          render json: UserSerializer.render(user), status: :created
        else
          render json: { message: user.errors.full_messages.to_sentence, errors: user.errors.to_hash }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email].to_s.downcase.strip)

        if user&.authenticate(params[:password])
          sign_in(user)
          render json: UserSerializer.render(user)
        else
          render json: { message: "Invalid email or password." }, status: :unauthorized
        end
      end

      def logout
        sign_out
        head :no_content
      end
    end
  end
end
