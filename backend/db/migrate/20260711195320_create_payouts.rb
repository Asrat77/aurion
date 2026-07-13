class CreatePayouts < ActiveRecord::Migration[8.1]
  def change
    create_table :payouts do |t|
      t.references :vendor, null: false, foreign_key: true
      t.references :order_item, null: false, foreign_key: true, index: { unique: true }
      t.integer :amount_cents, null: false
      t.integer :status, null: false, default: 0

      t.timestamps
    end
  end
end
