class AddTradeInvariants < ActiveRecord::Migration[8.1]
  def change
    add_index :quotations, :request_for_quote_id,
              unique: true,
              where: "status = 'accepted'",
              name: "index_quotations_on_rfq_single_accepted"
  end
end
