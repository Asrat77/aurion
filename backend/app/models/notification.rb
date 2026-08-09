class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :organization, optional: true

  validates :kind, :title, :body, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :reverse_chronologically, -> { order(created_at: :desc) }

  def read!
    update!(read_at: Time.current)
  end
end
