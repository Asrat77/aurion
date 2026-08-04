# A thread between one buyer and one vendor. Threads are keyed on the pair plus
# an optional context (an order or a product), so a follow-up about the same
# order lands in the same place rather than starting a new conversation.
class Conversation < ApplicationRecord
  belongs_to :buyer, class_name: "User"
  belongs_to :vendor
  belongs_to :order, optional: true
  belongs_to :product, optional: true

  has_many :messages, dependent: :destroy

  validates :subject, presence: true, length: { maximum: 200 }

  scope :most_recent_first, -> { order(last_message_at: :desc) }
  scope :for_buyer, ->(user) { where(buyer: user) }
  scope :for_vendor, ->(vendor) { where(vendor: vendor) }

  # Everyone entitled to read the thread. Used to decide who a message is
  # unread *for*.
  def participant_ids
    [ buyer_id, vendor.user_id ]
  end

  def participant?(user)
    participant_ids.include?(user.id)
  end

  def unread_count_for(user)
    messages.where.not(sender_id: user.id).where(read_at: nil).count
  end

  def mark_read_for!(user)
    messages.where.not(sender_id: user.id).where(read_at: nil).update_all(read_at: Time.current)
  end

  def post!(sender:, body:)
    message = messages.create!(sender: sender, body: body)
    update!(last_message_at: message.created_at)
    message
  end
end
