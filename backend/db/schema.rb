# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_11_195320) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "categories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_categories_on_slug", unique: true
  end

  create_table "order_items", force: :cascade do |t|
    t.integer "commission_cents", null: false
    t.datetime "created_at", null: false
    t.integer "line_total_cents", null: false
    t.integer "net_cents", null: false
    t.bigint "order_id", null: false
    t.bigint "product_id", null: false
    t.string "product_name", null: false
    t.integer "quantity", null: false
    t.integer "unit_price_cents", null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
    t.index ["vendor_id"], name: "index_order_items_on_vendor_id"
  end

  create_table "orders", force: :cascade do |t|
    t.bigint "buyer_id", null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.decimal "fx_rate", precision: 10, scale: 4, default: "1.0", null: false
    t.datetime "paid_at"
    t.string "payment_method"
    t.string "payment_ref"
    t.json "shipping_address"
    t.integer "shipping_cents", null: false
    t.integer "status", default: 0, null: false
    t.integer "subtotal_cents", null: false
    t.integer "tax_cents", null: false
    t.integer "total_cents", null: false
    t.datetime "updated_at", null: false
    t.index ["buyer_id"], name: "index_orders_on_buyer_id"
  end

  create_table "payouts", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.datetime "created_at", null: false
    t.bigint "order_item_id", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["order_item_id"], name: "index_payouts_on_order_item_id", unique: true
    t.index ["vendor_id"], name: "index_payouts_on_vendor_id"
  end

  create_table "products", force: :cascade do |t|
    t.bigint "category_id", null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.text "description"
    t.string "emoji"
    t.string "name", null: false
    t.string "origin"
    t.integer "price_cents", default: 0, null: false
    t.decimal "rating", precision: 3, scale: 2
    t.integer "reviews_count", default: 0, null: false
    t.string "slug", null: false
    t.integer "status", default: 0, null: false
    t.integer "stock", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["category_id"], name: "index_products_on_category_id"
    t.index ["slug"], name: "index_products_on_slug", unique: true
    t.index ["vendor_id"], name: "index_products_on_vendor_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "phone"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "vendors", force: :cascade do |t|
    t.text "bio"
    t.decimal "commission_rate", precision: 5, scale: 4, default: "0.15", null: false
    t.datetime "created_at", null: false
    t.string "payout_method"
    t.string "slug", null: false
    t.integer "status", default: 0, null: false
    t.string "store_name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["slug"], name: "index_vendors_on_slug", unique: true
    t.index ["user_id"], name: "index_vendors_on_user_id", unique: true
  end

  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "products"
  add_foreign_key "order_items", "vendors"
  add_foreign_key "orders", "users", column: "buyer_id"
  add_foreign_key "payouts", "order_items"
  add_foreign_key "payouts", "vendors"
  add_foreign_key "products", "categories"
  add_foreign_key "products", "vendors"
  add_foreign_key "vendors", "users"
end
