module Api
  module V1
    class ConversationsController < ApplicationController
      before_action :authenticate!

      # Both sides use this one inbox: a buyer sees threads they started, a
      # vendor sees threads about their store.
      def index
        render json: {
          conversations: visible_conversations.most_recent_first.map { |c|
            ConversationSerializer.render(c, viewer: current_user)
          },
          unreadTotal: unread_total
        }
      end

      def show
        conversation = visible_conversations.find(params[:id])
        conversation.mark_read_for!(current_user)

        render json: ConversationSerializer.render(
          conversation.reload, viewer: current_user, include_messages: true
        )
      end

      # Starting a thread is a buyer action — a vendor cannot cold-message
      # someone who has not contacted them.
      def create
        vendor = ::Vendor.active.find(params[:vendor_id])
        order = current_user.orders.find_by(id: params[:order_id])
        product = Product.find_by(id: params[:product_id])

        conversation = Conversation.find_or_initialize_by(
          buyer: current_user, vendor: vendor, order: order, product: product
        )

        if conversation.new_record?
          conversation.subject = params[:subject].presence || default_subject(order, product, vendor)
          conversation.last_message_at = Time.current
        end

        ActiveRecord::Base.transaction do
          conversation.save!
          conversation.post!(sender: current_user, body: params[:body])
        end

        render json: ConversationSerializer.render(
          conversation.reload, viewer: current_user, include_messages: true
        ), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.record.errors.full_messages.to_sentence },
               status: :unprocessable_entity
      end

      def reply
        conversation = visible_conversations.find(params[:id])
        message = conversation.post!(sender: current_user, body: params[:body])

        render json: MessageSerializer.render(message, viewer: current_user), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.record.errors.full_messages.to_sentence },
               status: :unprocessable_entity
      end

      private

      # Scoping every action through this is what keeps one buyer out of
      # another's threads, and one vendor out of another's.
      def visible_conversations
        base = Conversation.includes(:buyer, :vendor, :order, :product, :messages)

        if current_user.vendor
          base.where(buyer: current_user).or(base.where(vendor: current_user.vendor))
        else
          base.for_buyer(current_user)
        end
      end

      def unread_total
        visible_conversations.sum { |c| c.unread_count_for(current_user) }
      end

      def default_subject(order, product, vendor)
        return "Order #{order.reference}" if order
        return product.name if product

        vendor.store_name
      end
    end
  end
end
