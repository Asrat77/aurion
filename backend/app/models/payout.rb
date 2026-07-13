class Payout < ApplicationRecord
  belongs_to :vendor
  belongs_to :order_item

  enum :status, { pending: 0, paid: 1 }
end
