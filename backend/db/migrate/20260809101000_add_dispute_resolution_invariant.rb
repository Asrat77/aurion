class AddDisputeResolutionInvariant < ActiveRecord::Migration[8.1]
  def change
    add_index :dispute_resolutions, :trade_dispute_id, unique: true,
              name: "index_dispute_resolutions_on_trade_dispute_unique"
  end
end
