class AddWholesaleTerms < ActiveRecord::Migration[8.1]
  def change
    # Commercial terms a product carries when it is available at scale. A
    # product with no MOQ is retail-only and simply does not appear in the
    # wholesale catalogue.
    add_column :products, :moq, :integer
    add_column :products, :unit_of_measure, :string
    add_column :products, :lead_time_days, :integer
    add_column :products, :packaging, :string
    add_column :products, :sample_available, :boolean, null: false, default: false
    add_column :products, :sample_price_cents, :integer

    add_index :products, :moq

    # Volume breaks: buy at least `min_quantity` and the unit price drops.
    create_table :price_tiers do |t|
      t.references :product, null: false, foreign_key: true
      t.integer :min_quantity, null: false
      t.integer :unit_price_cents, null: false

      t.timestamps
    end

    add_index :price_tiers, [ :product_id, :min_quantity ], unique: true

    # Richer RFQ intake, plus the quote an admin sends back.
    add_reference :request_for_quotes, :product, foreign_key: true
    add_column :request_for_quotes, :incoterm, :string
    add_column :request_for_quotes, :destination_port, :string
    add_column :request_for_quotes, :target_price_cents, :integer
    add_column :request_for_quotes, :sample_requested, :boolean, null: false, default: false
    add_column :request_for_quotes, :quoted_unit_price_cents, :integer
    add_column :request_for_quotes, :quoted_lead_time_days, :integer
    add_column :request_for_quotes, :quote_note, :text
    add_column :request_for_quotes, :quoted_at, :datetime
  end
end
