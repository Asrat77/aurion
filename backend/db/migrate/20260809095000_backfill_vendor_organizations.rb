class BackfillVendorOrganizations < ActiveRecord::Migration[8.1]
  def up
    vendor_record = Class.new(ActiveRecord::Base) { self.table_name = "vendors" }
    organization_record = Class.new(ActiveRecord::Base) { self.table_name = "organizations" }
    membership_record = Class.new(ActiveRecord::Base) { self.table_name = "organization_memberships" }

    vendor_record.reset_column_information
    organization_record.reset_column_information
    membership_record.reset_column_information

    vendor_record.where(organization_id: nil).find_each do |vendor|
      active = vendor.status.to_i == 1
      organization = organization_record.create!(
        name: vendor.store_name,
        kind: "supplier",
        status: active ? "active" : "pending",
        verification_status: active ? "verified" : "unverified",
        country: vendor.country,
        registration_number: vendor.business_registration,
        verified_at: active ? Time.current : nil
      )
      membership_record.create!(organization_id: organization.id, user_id: vendor.user_id,
                                role: "owner", status: "active")
      vendor.update_columns(organization_id: organization.id, updated_at: Time.current)
    end
  end

  def down
    # Organization records are durable business identity. They are intentionally
    # not deleted during rollback because later trades may reference them.
  end
end
