class AddSupplierDirectoryAttributes < ActiveRecord::Migration[8.1]
  # The supplier directory filters on region and certification. Both are
  # supplier-declared and only count once an administrator has verified the
  # capability, so an unverified claim never reaches a buyer as a badge.
  def change
    add_column :supplier_capabilities, :region, :string
    add_column :supplier_capabilities, :certifications, :json, null: false, default: []
    add_index :supplier_capabilities, :region
  end
end
