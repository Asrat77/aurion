class AddOrderLifecycle < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :shipped_at, :datetime
    add_column :orders, :delivered_at, :datetime
    add_column :orders, :cancelled_at, :datetime
    add_column :orders, :stock_released, :boolean, null: false, default: false

    # A cart can span several vendors, so fulfilment is tracked per line: each
    # vendor ships their own items and the order's status is derived from them.
    add_column :order_items, :fulfillment_status, :integer, null: false, default: 0
    add_column :order_items, :shipped_at, :datetime
    add_column :order_items, :delivered_at, :datetime
    add_column :order_items, :carrier, :string
    add_column :order_items, :tracking_number, :string

    add_column :products, :free_shipping, :boolean, null: false, default: false

    create_table :order_events do |t|
      t.references :order, null: false, foreign_key: true
      t.references :order_item, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :label, null: false
      t.string :note

      t.timestamps
    end

    add_index :order_events, [ :order_id, :created_at ]
  end
end
