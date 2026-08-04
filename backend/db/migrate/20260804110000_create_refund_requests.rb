class CreateRefundRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :refund_requests do |t|
      t.references :order, null: false, foreign_key: true
      # Scoped to a line so a buyer can dispute one vendor's item without
      # unwinding the rest of a multi-vendor order.
      t.references :order_item, null: false, foreign_key: true
      t.references :buyer, null: false, foreign_key: { to_table: :users }
      t.references :resolved_by, foreign_key: { to_table: :users }
      t.integer :reason, null: false, default: 0
      t.text :detail
      t.integer :status, null: false, default: 0
      t.integer :amount_cents, null: false
      t.string :resolution_note
      t.datetime :resolved_at

      t.timestamps
    end

    # One open request per line; resolved ones stay for the record.
    add_index :refund_requests, [ :order_item_id, :status ]
  end
end
