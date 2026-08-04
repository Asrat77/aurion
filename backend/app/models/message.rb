class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, class_name: "User"

  validates :body, presence: true, length: { maximum: 4000 }
  validate :sender_is_a_participant

  scope :chronologically, -> { order(:created_at, :id) }

  def read?
    read_at.present?
  end

  private

  def sender_is_a_participant
    return if conversation.nil? || sender.nil?
    return if conversation.participant?(sender)

    errors.add(:sender, "is not part of this conversation")
  end
end
