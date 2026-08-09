module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :authenticate!

      def index
        notifications = current_user.notifications.includes(:organization).reverse_chronologically.limit(100)
        render json: notifications.map { |notification|
          { id: notification.id, kind: notification.kind, title: notification.title,
            body: notification.body, data: notification.data, readAt: notification.read_at&.iso8601,
            organizationId: notification.organization_id, createdAt: notification.created_at.iso8601 }
        }
      end

      def read
        notification = current_user.notifications.find(params[:id])
        notification.read!
        render json: { id: notification.id, readAt: notification.read_at.iso8601 }
      end
    end
  end
end
