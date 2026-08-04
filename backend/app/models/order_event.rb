# One line of an order's history. Events are append-only and are what the buyer
# sees as the tracking timeline, so the label is stored rather than derived —
# renaming a status later must not rewrite what already happened.
class OrderEvent < ApplicationRecord
  belongs_to :order
  # Set when the event concerns a single vendor's line rather than the order.
  belongs_to :order_item, optional: true
  # Nil for events the system records itself, such as payment confirmation.
  belongs_to :actor, class_name: "User", optional: true

  validates :label, presence: true

  scope :chronologically, -> { order(:created_at, :id) }
end
