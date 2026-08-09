class ConversationSerializer
  def self.render(conversation, viewer:, include_messages: false)
    last = conversation.messages.chronologically.last

    hash = {
      id: conversation.id,
      subject: conversation.subject,
      # Each side sees who they are talking to, not their own name.
      counterpartName: counterpart_name(conversation, viewer),
      vendorSlug: conversation.vendor.slug,
      orderId: conversation.order_id,
      orderReference: conversation.order&.reference,
      productSlug: conversation.product&.slug,
      productName: conversation.product&.name,
      unreadCount: conversation.unread_count_for(viewer),
      lastMessagePreview: last&.body&.truncate(120),
      lastMessageAt: conversation.last_message_at,
      createdAt: conversation.created_at
    }

    if include_messages
      hash[:messages] = conversation.messages.chronologically.map { |m|
        MessageSerializer.render(m, viewer: viewer)
      }
    end

    hash
  end

  def self.counterpart_name(conversation, viewer)
    viewer.id == conversation.buyer_id ? conversation.vendor.store_name : conversation.buyer.name
  end
end
