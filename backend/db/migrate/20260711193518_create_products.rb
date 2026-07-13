class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.references :vendor, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.integer :price_cents, null: false, default: 0
      t.string :currency, null: false, default: "USD"
      t.integer :stock, null: false, default: 0
      t.string :emoji
      t.string :origin
      t.decimal :rating, precision: 3, scale: 2
      t.integer :reviews_count, null: false, default: 0
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :products, :slug, unique: true
  end
end
