class CreateAssistantExchanges < ActiveRecord::Migration[8.1]
  # One row per assistant turn. The assistant is answering customers and
  # buyers, so what it was asked, what grounded the answer, which provider
  # served it and what it cost all have to be reviewable after the fact.
  def change
    create_table :assistant_exchanges do |t|
      t.references :user, foreign_key: true
      t.string :conversation_key, null: false
      t.string :channel, null: false
      t.string :task, null: false
      t.string :provider, null: false
      t.string :model, null: false
      t.string :status, null: false, default: "pending"
      t.text :question, null: false
      t.text :answer
      t.text :error
      # What was retrieved from our own database to ground the answer.
      t.json :grounding, null: false, default: {}
      t.integer :input_tokens
      t.integer :output_tokens
      t.integer :latency_ms

      t.timestamps
    end

    add_index :assistant_exchanges, :conversation_key
    add_index :assistant_exchanges, [ :created_at, :status ]
    add_index :assistant_exchanges, [ :user_id, :created_at ]
  end
end
