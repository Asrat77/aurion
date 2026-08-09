class OrderEventSerializer
  def self.render(event)
    {
      id: event.id,
      label: event.label,
      note: event.note,
      orderItemId: event.order_item_id,
      createdAt: event.created_at
    }
  end
end
