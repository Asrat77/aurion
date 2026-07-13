class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :buyer, null: false, foreign_key: { to_table: :users }
      t.integer :status, null: false, default: 0
      t.integer :subtotal_cents, null: false
      t.integer :shipping_cents, null: false
      t.integer :tax_cents, null: false
      t.integer :total_cents, null: false
      t.string :currency, null: false, default: "USD"
      t.decimal :fx_rate, precision: 10, scale: 4, null: false, default: 1
      t.string :payment_method
      t.string :payment_ref
      t.json :shipping_address
      t.datetime :paid_at

      t.timestamps
    end
  end
end
