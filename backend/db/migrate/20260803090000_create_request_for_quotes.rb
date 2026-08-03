class CreateRequestForQuotes < ActiveRecord::Migration[8.1]
  def change
    create_table :request_for_quotes do |t|
      t.string :reference, null: false
      t.string :company_name, null: false
      t.string :contact_name
      t.string :email, null: false
      t.string :country
      t.string :product_interest, null: false
      t.string :estimated_quantity
      t.text :specifications
      t.string :status, null: false, default: "new"

      t.timestamps
    end

    add_index :request_for_quotes, :reference, unique: true
    add_index :request_for_quotes, [ :status, :created_at ]
  end
end
