class AddVendorApplicationFields < ActiveRecord::Migration[8.1]
  def change
    # Details a prospective vendor supplies when applying, and the record of
    # how that application was decided.
    add_column :vendors, :contact_name, :string
    add_column :vendors, :contact_phone, :string
    add_column :vendors, :business_registration, :string
    add_column :vendors, :city, :string
    add_column :vendors, :country, :string
    add_column :vendors, :website, :string
    add_column :vendors, :product_focus, :string
    add_column :vendors, :applied_at, :datetime
    add_column :vendors, :reviewed_at, :datetime
    add_column :vendors, :review_note, :string
    add_reference :vendors, :reviewed_by, foreign_key: { to_table: :users }

    add_index :vendors, [ :status, :applied_at ]
  end
end
