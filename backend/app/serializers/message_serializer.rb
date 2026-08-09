class MessageSerializer
  def self.render(message, viewer:)
    {
      id: message.id,
      body: message.body,
      # Lets the UI place the bubble without leaking the other side's user id.
      mine: message.sender_id == viewer.id,
      senderName: message.sender.name,
      readAt: message.read_at,
      createdAt: message.created_at.iso8601
    }
  end
end
