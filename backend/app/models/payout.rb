class Payout < ApplicationRecord
  STATES = %w[pending blocked released reversed failed].freeze

  belongs_to :vendor
  belongs_to :order_item

  enum :status, { pending: 0, paid: 1 }
  enum :state, STATES.index_with(&:to_s), prefix: true

  default_scope { where.not(state: :reversed) }

  def release!(reference: nil)
    return self if state_released?
    raise ArgumentError, "A blocked payout cannot be released" if state_blocked?

    update!(state: :released, status: :paid, released_at: Time.current, state_note: reference)
  end

  def block!(note: nil)
    update!(state: :blocked, state_note: note)
  end

  def reverse!(note: nil)
    return self if state_reversed?

    update!(state: :reversed, reversed_at: Time.current, state_note: note)
  end

  def fail!(note: nil)
    update!(state: :failed, failed_at: Time.current, state_note: note)
  end
end
