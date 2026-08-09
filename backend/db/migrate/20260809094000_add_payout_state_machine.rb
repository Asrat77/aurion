class AddPayoutStateMachine < ActiveRecord::Migration[8.1]
  def change
    add_column :payouts, :state, :string, null: false, default: "pending"
    add_column :payouts, :state_note, :text
    add_column :payouts, :released_at, :datetime
    add_column :payouts, :reversed_at, :datetime
    add_column :payouts, :failed_at, :datetime
    add_index :payouts, [ :vendor_id, :state ]
    execute "UPDATE payouts SET state = CASE WHEN status = 1 THEN 'released' ELSE 'pending' END"
  end
end
