class SupplierCapability < ApplicationRecord
  belongs_to :vendor
  belongs_to :category, optional: true

  validates :destinations, presence: true
  validates :min_quantity, :max_quantity, :max_lead_time_days,
            numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  def serves?(destination)
    return true if destinations.blank? || destination.blank?

    destinations.any? { |value| value.to_s.casecmp?(destination.to_s) }
  end

  def fits_quantity?(quantity)
    return false if min_quantity.present? && quantity < min_quantity
    return false if max_quantity.present? && quantity > max_quantity

    true
  end

  def fits_lead_time?(lead_time_days)
    max_lead_time_days.blank? || lead_time_days.blank? || lead_time_days <= max_lead_time_days
  end
end
