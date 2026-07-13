class CreateVendors < ActiveRecord::Migration[8.1]
  def change
    create_table :vendors do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :store_name, null: false
      t.string :slug, null: false
      t.decimal :commission_rate, precision: 5, scale: 4, null: false, default: 0.15
      t.integer :status, null: false, default: 0
      t.text :bio
      t.string :payout_method

      t.timestamps
    end

    add_index :vendors, :slug, unique: true
  end
end
