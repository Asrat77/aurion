class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.references :buyer, null: false, foreign_key: { to_table: :users }
      t.references :vendor, null: false, foreign_key: true
      # Optional context: a thread is usually about one order or one product,
      # and knowing which saves both sides re-explaining it.
      t.references :order, foreign_key: true
      t.references :product, foreign_key: true
      t.string :subject, null: false
      t.datetime :last_message_at, null: false

      t.timestamps
    end

    # One thread per buyer/vendor/context, so replies stay together instead of
    # spawning a new thread each time.
    add_index :conversations, [ :buyer_id, :vendor_id, :order_id, :product_id ],
              unique: true, name: "index_conversations_on_participants_and_context"
    add_index :conversations, :last_message_at

    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false
      t.datetime :read_at

      t.timestamps
    end

    add_index :messages, [ :conversation_id, :created_at ]
  end
end
