class User < ApplicationRecord
  has_secure_password

  has_one :vendor, dependent: :destroy
  has_many :orders, foreign_key: :buyer_id, inverse_of: :buyer, dependent: :restrict_with_error

  enum :role, { buyer: 0, vendor: 1, admin: 2 }

  before_validation { self.email = email.to_s.downcase.strip }

  validates :email, presence: true, uniqueness: true,
                     format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }
end
