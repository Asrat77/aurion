class CreateReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :reviews do |t|
      t.references :product, null: false, foreign_key: true
      t.references :buyer, null: false, foreign_key: { to_table: :users }
      # The delivered line that entitles this review. Unique, so a buyer can
      # review a product once per purchase and never without buying it.
      t.references :order_item, null: false, foreign_key: true, index: { unique: true }
      t.integer :rating, null: false
      t.string :title
      t.text :body
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :reviews, [ :product_id, :status ]
  end
end
