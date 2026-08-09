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

ActiveRecord::Schema[8.1].define(version: 2026_08_09_110000) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.integer "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "idx_on_blob_id_variation_digest_f36bede0d9", unique: true
  end

  create_table "categories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_categories_on_slug", unique: true
  end

  create_table "conversations", force: :cascade do |t|
    t.bigint "buyer_id", null: false
    t.datetime "created_at", null: false
    t.datetime "last_message_at", null: false
    t.bigint "order_id"
    t.bigint "product_id"
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["buyer_id", "vendor_id", "order_id", "product_id"], name: "index_conversations_on_participants_and_context", unique: true
    t.index ["buyer_id"], name: "index_conversations_on_buyer_id"
    t.index ["last_message_at"], name: "index_conversations_on_last_message_at"
    t.index ["order_id"], name: "index_conversations_on_order_id"
    t.index ["product_id"], name: "index_conversations_on_product_id"
    t.index ["vendor_id"], name: "index_conversations_on_vendor_id"
  end

  create_table "delivery_acceptances", force: :cascade do |t|
    t.datetime "accepted_at", null: false
    t.datetime "created_at", null: false
    t.integer "organization_id", null: false
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["organization_id"], name: "index_delivery_acceptances_on_organization_id"
    t.index ["trade_order_id"], name: "index_delivery_acceptances_on_trade_order_id", unique: true
    t.index ["user_id"], name: "index_delivery_acceptances_on_user_id"
  end

  create_table "dispute_evidence", force: :cascade do |t|
    t.json "attachments", default: {}, null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.integer "submitted_by_id", null: false
    t.integer "trade_dispute_id", null: false
    t.datetime "updated_at", null: false
    t.index ["submitted_by_id"], name: "index_dispute_evidence_on_submitted_by_id"
    t.index ["trade_dispute_id"], name: "index_dispute_evidence_on_trade_dispute_id"
  end

  create_table "dispute_resolutions", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.text "note"
    t.integer "refund_cents", default: 0, null: false
    t.integer "release_cents", default: 0, null: false
    t.integer "resolved_by_id", null: false
    t.integer "trade_dispute_id", null: false
    t.datetime "updated_at", null: false
    t.index ["resolved_by_id"], name: "index_dispute_resolutions_on_resolved_by_id"
    t.index ["trade_dispute_id"], name: "index_dispute_resolutions_on_trade_dispute_id"
    t.index ["trade_dispute_id"], name: "index_dispute_resolutions_on_trade_dispute_unique", unique: true
  end

  create_table "financial_movements", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.datetime "created_at", null: false
    t.string "currency", null: false
    t.string "external_reference"
    t.json "metadata", default: {}, null: false
    t.string "movement_type", null: false
    t.datetime "occurred_at", null: false
    t.integer "protected_payment_id"
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["protected_payment_id"], name: "index_financial_movements_on_protected_payment_id"
    t.index ["trade_order_id", "movement_type", "external_reference"], name: "index_movements_on_trade_type_reference", unique: true
  end

  create_table "idempotency_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.string "request_hash", null: false
    t.bigint "resource_id"
    t.string "resource_type"
    t.json "response_body", default: {}, null: false
    t.integer "response_status", null: false
    t.string "scope_key", null: false
    t.datetime "updated_at", null: false
    t.index ["scope_key", "key"], name: "index_idempotency_records_on_scope_key_and_key", unique: true
  end

  create_table "inspection_reports", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.json "evidence", default: {}, null: false
    t.integer "inspection_id", null: false
    t.string "sha256", null: false
    t.integer "submitted_by_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version", null: false
    t.index ["inspection_id", "version"], name: "index_inspection_reports_on_inspection_id_and_version", unique: true
    t.index ["inspection_id"], name: "index_inspection_reports_on_inspection_id"
    t.index ["submitted_by_id"], name: "index_inspection_reports_on_submitted_by_id"
  end

  create_table "inspections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.string "outcome"
    t.datetime "reviewed_at"
    t.integer "reviewed_by_id"
    t.string "status", default: "awaiting_evidence", null: false
    t.integer "submitted_by_id"
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["reviewed_by_id"], name: "index_inspections_on_reviewed_by_id"
    t.index ["submitted_by_id"], name: "index_inspections_on_submitted_by_id"
  end

  create_table "messages", force: :cascade do |t|
    t.text "body", null: false
    t.bigint "conversation_id", null: false
    t.datetime "created_at", null: false
    t.datetime "read_at"
    t.bigint "sender_id", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "created_at"], name: "index_messages_on_conversation_id_and_created_at"
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["sender_id"], name: "index_messages_on_sender_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.json "data", default: {}, null: false
    t.string "kind", null: false
    t.integer "organization_id"
    t.datetime "read_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["organization_id"], name: "index_notifications_on_organization_id"
    t.index ["user_id", "read_at", "created_at"], name: "index_notifications_on_user_id_and_read_at_and_created_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "order_events", force: :cascade do |t|
    t.bigint "actor_id"
    t.datetime "created_at", null: false
    t.string "label", null: false
    t.string "note"
    t.bigint "order_id", null: false
    t.bigint "order_item_id"
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_order_events_on_actor_id"
    t.index ["order_id", "created_at"], name: "index_order_events_on_order_id_and_created_at"
    t.index ["order_id"], name: "index_order_events_on_order_id"
    t.index ["order_item_id"], name: "index_order_events_on_order_item_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.string "carrier"
    t.integer "commission_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "delivered_at"
    t.integer "fulfillment_status", default: 0, null: false
    t.integer "line_total_cents", null: false
    t.integer "net_cents", null: false
    t.bigint "order_id", null: false
    t.bigint "product_id", null: false
    t.string "product_name", null: false
    t.integer "quantity", null: false
    t.datetime "shipped_at"
    t.string "tracking_number"
    t.integer "unit_price_cents", null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
    t.index ["vendor_id"], name: "index_order_items_on_vendor_id"
  end

  create_table "orders", force: :cascade do |t|
    t.bigint "buyer_id", null: false
    t.datetime "cancelled_at"
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.datetime "delivered_at"
    t.decimal "fx_rate", precision: 10, scale: 4, default: "1.0", null: false
    t.datetime "paid_at"
    t.string "payment_method"
    t.string "payment_ref"
    t.datetime "shipped_at"
    t.json "shipping_address"
    t.integer "shipping_cents", null: false
    t.integer "status", default: 0, null: false
    t.boolean "stock_released", default: false, null: false
    t.integer "subtotal_cents", null: false
    t.integer "tax_cents", null: false
    t.integer "total_cents", null: false
    t.datetime "updated_at", null: false
    t.index ["buyer_id"], name: "index_orders_on_buyer_id"
  end

  create_table "organization_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "organization_id", null: false
    t.string "role", default: "buyer", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["organization_id", "user_id"], name: "index_memberships_on_organization_and_user", unique: true
    t.index ["organization_id"], name: "index_organization_memberships_on_organization_id"
    t.index ["user_id"], name: "index_organization_memberships_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "country"
    t.datetime "created_at", null: false
    t.string "kind", default: "buyer", null: false
    t.string "legal_name"
    t.string "name", null: false
    t.string "registration_number"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.string "verification_status", default: "unverified", null: false
    t.datetime "verified_at"
    t.integer "verified_by_id"
    t.index ["kind", "status"], name: "index_organizations_on_kind_and_status"
    t.index ["registration_number"], name: "index_organizations_on_registration_number", unique: true, where: "registration_number IS NOT NULL"
    t.index ["verified_by_id"], name: "index_organizations_on_verified_by_id"
  end

  create_table "payouts", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "failed_at"
    t.bigint "order_item_id", null: false
    t.datetime "released_at"
    t.datetime "reversed_at"
    t.string "state", default: "pending", null: false
    t.text "state_note"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["order_item_id"], name: "index_payouts_on_order_item_id", unique: true
    t.index ["vendor_id", "state"], name: "index_payouts_on_vendor_id_and_state"
    t.index ["vendor_id"], name: "index_payouts_on_vendor_id"
  end

  create_table "price_tiers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "min_quantity", null: false
    t.bigint "product_id", null: false
    t.integer "unit_price_cents", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "min_quantity"], name: "index_price_tiers_on_product_id_and_min_quantity", unique: true
    t.index ["product_id"], name: "index_price_tiers_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.boolean "business_enabled", default: false, null: false
    t.bigint "category_id", null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.text "description"
    t.string "emoji"
    t.boolean "express_enabled", default: true, null: false
    t.boolean "free_shipping", default: false, null: false
    t.integer "lead_time_days"
    t.integer "moq"
    t.string "name", null: false
    t.string "origin"
    t.string "packaging"
    t.integer "price_cents", default: 0, null: false
    t.decimal "rating", precision: 3, scale: 2
    t.integer "reviews_count", default: 0, null: false
    t.boolean "sample_available", default: false, null: false
    t.integer "sample_price_cents"
    t.string "slug", null: false
    t.integer "status", default: 0, null: false
    t.integer "stock", default: 0, null: false
    t.string "unit_of_measure"
    t.datetime "updated_at", null: false
    t.bigint "vendor_id", null: false
    t.index ["category_id"], name: "index_products_on_category_id"
    t.index ["moq"], name: "index_products_on_moq"
    t.index ["slug"], name: "index_products_on_slug", unique: true
    t.index ["vendor_id"], name: "index_products_on_vendor_id"
  end

  create_table "protected_payments", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.datetime "created_at", null: false
    t.string "currency", null: false
    t.string "external_id"
    t.datetime "funded_at"
    t.datetime "last_synced_at"
    t.json "metadata", default: {}, null: false
    t.string "provider", null: false
    t.datetime "refunded_at"
    t.datetime "release_requested_at"
    t.datetime "released_at"
    t.string "status", default: "created", null: false
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["provider", "external_id"], name: "index_protected_payments_on_provider_and_external_id", unique: true, where: "external_id IS NOT NULL"
    t.index ["trade_order_id"], name: "index_protected_payments_on_trade_order_id", unique: true
  end

  create_table "provider_accounts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "external_account_id", null: false
    t.json "metadata", default: {}, null: false
    t.integer "organization_id", null: false
    t.boolean "payout_capability", default: false, null: false
    t.string "provider", null: false
    t.datetime "synced_at"
    t.datetime "updated_at", null: false
    t.string "verification_status", default: "pending", null: false
    t.index ["organization_id"], name: "index_provider_accounts_on_organization_id"
    t.index ["provider", "external_account_id"], name: "index_provider_accounts_on_provider_and_external_account_id", unique: true
  end

  create_table "provider_events", force: :cascade do |t|
    t.integer "attempts", default: 0, null: false
    t.datetime "created_at", null: false
    t.text "error"
    t.string "event_type", null: false
    t.string "external_event_id", null: false
    t.json "payload", default: {}, null: false
    t.string "payload_checksum", null: false
    t.datetime "processed_at"
    t.string "provider", null: false
    t.string "status", default: "received", null: false
    t.datetime "updated_at", null: false
    t.index ["provider", "external_event_id"], name: "index_provider_events_on_provider_and_external_event_id", unique: true
  end

  create_table "quotation_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.string "description", null: false
    t.integer "line_total_cents", null: false
    t.integer "product_id"
    t.integer "quantity", null: false
    t.integer "quotation_id", null: false
    t.integer "unit_price_cents", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_quotation_items_on_product_id"
    t.index ["quotation_id"], name: "index_quotation_items_on_quotation_id"
  end

  create_table "quotations", force: :cascade do |t|
    t.datetime "accepted_at"
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.string "incoterm"
    t.integer "lead_time_days"
    t.text "note"
    t.integer "request_for_quote_id", null: false
    t.integer "revision", default: 1, null: false
    t.integer "shipping_cents", default: 0, null: false
    t.string "status", default: "draft", null: false
    t.datetime "submitted_at"
    t.integer "supersedes_id"
    t.integer "total_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.datetime "valid_until"
    t.integer "vendor_id", null: false
    t.datetime "withdrawn_at"
    t.index ["request_for_quote_id", "status"], name: "index_quotations_on_request_for_quote_id_and_status"
    t.index ["request_for_quote_id", "vendor_id", "revision"], name: "index_quotations_on_rfq_vendor_revision", unique: true
    t.index ["request_for_quote_id"], name: "index_quotations_on_request_for_quote_id"
    t.index ["request_for_quote_id"], name: "index_quotations_on_rfq_single_accepted", unique: true, where: "status = 'accepted'"
    t.index ["supersedes_id"], name: "index_quotations_on_supersedes_id"
    t.index ["vendor_id"], name: "index_quotations_on_vendor_id"
  end

  create_table "refund_requests", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.bigint "buyer_id", null: false
    t.datetime "created_at", null: false
    t.text "detail"
    t.bigint "order_id", null: false
    t.bigint "order_item_id", null: false
    t.integer "reason", default: 0, null: false
    t.string "resolution_note"
    t.datetime "resolved_at"
    t.bigint "resolved_by_id"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["buyer_id"], name: "index_refund_requests_on_buyer_id"
    t.index ["order_id"], name: "index_refund_requests_on_order_id"
    t.index ["order_item_id", "status"], name: "index_refund_requests_on_order_item_id_and_status"
    t.index ["order_item_id"], name: "index_refund_requests_on_order_item_id"
    t.index ["resolved_by_id"], name: "index_refund_requests_on_resolved_by_id"
  end

  create_table "request_for_quote_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.integer "product_id"
    t.integer "quantity", null: false
    t.integer "request_for_quote_id", null: false
    t.text "specifications"
    t.string "unit_of_measure"
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_request_for_quote_items_on_product_id"
    t.index ["request_for_quote_id"], name: "index_request_for_quote_items_on_request_for_quote_id"
  end

  create_table "request_for_quotes", force: :cascade do |t|
    t.integer "buyer_id"
    t.string "company_name", null: false
    t.string "contact_name"
    t.string "country"
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.string "destination_port"
    t.string "email", null: false
    t.string "estimated_quantity"
    t.string "incoterm"
    t.boolean "inspection_required", default: false, null: false
    t.integer "organization_id"
    t.bigint "product_id"
    t.string "product_interest", null: false
    t.text "quote_note"
    t.datetime "quoted_at"
    t.integer "quoted_lead_time_days"
    t.integer "quoted_unit_price_cents"
    t.string "reference", null: false
    t.boolean "sample_requested", default: false, null: false
    t.text "specifications"
    t.string "status", default: "new", null: false
    t.integer "target_price_cents"
    t.datetime "updated_at", null: false
    t.index ["buyer_id"], name: "index_request_for_quotes_on_buyer_id"
    t.index ["organization_id"], name: "index_request_for_quotes_on_organization_id"
    t.index ["product_id"], name: "index_request_for_quotes_on_product_id"
    t.index ["reference"], name: "index_request_for_quotes_on_reference", unique: true
    t.index ["status", "created_at"], name: "index_request_for_quotes_on_status_and_created_at"
  end

  create_table "reviews", force: :cascade do |t|
    t.text "body"
    t.bigint "buyer_id", null: false
    t.datetime "created_at", null: false
    t.bigint "order_item_id", null: false
    t.bigint "product_id", null: false
    t.integer "rating", null: false
    t.integer "status", default: 0, null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["buyer_id"], name: "index_reviews_on_buyer_id"
    t.index ["order_item_id"], name: "index_reviews_on_order_item_id", unique: true
    t.index ["product_id", "status"], name: "index_reviews_on_product_id_and_status"
    t.index ["product_id"], name: "index_reviews_on_product_id"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "supplier_capabilities", force: :cascade do |t|
    t.integer "category_id"
    t.json "certifications", default: [], null: false
    t.datetime "created_at", null: false
    t.json "destinations", default: [], null: false
    t.integer "max_lead_time_days"
    t.integer "max_quantity"
    t.integer "min_quantity"
    t.text "notes"
    t.string "region"
    t.datetime "updated_at", null: false
    t.integer "vendor_id", null: false
    t.boolean "verified", default: false, null: false
    t.index ["category_id"], name: "index_supplier_capabilities_on_category_id"
    t.index ["region"], name: "index_supplier_capabilities_on_region"
    t.index ["vendor_id"], name: "index_supplier_capabilities_on_vendor_id"
  end

  create_table "supplier_invitations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "invited_at", null: false
    t.json "reasons", default: [], null: false
    t.integer "request_for_quote_id", null: false
    t.datetime "responded_at"
    t.integer "score", null: false
    t.string "status", default: "invited", null: false
    t.datetime "updated_at", null: false
    t.integer "vendor_id", null: false
    t.index ["request_for_quote_id", "score"], name: "index_supplier_invitations_on_request_for_quote_id_and_score"
    t.index ["request_for_quote_id", "vendor_id"], name: "index_invitations_on_rfq_and_vendor", unique: true
    t.index ["request_for_quote_id"], name: "index_supplier_invitations_on_request_for_quote_id"
    t.index ["vendor_id"], name: "index_supplier_invitations_on_vendor_id"
  end

  create_table "trade_disputes", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.datetime "created_at", null: false
    t.text "detail", null: false
    t.integer "opened_by_id", null: false
    t.string "reason", null: false
    t.text "resolution_note"
    t.datetime "resolved_at"
    t.integer "resolved_by_id"
    t.string "status", default: "open", null: false
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["opened_by_id"], name: "index_trade_disputes_on_opened_by_id"
    t.index ["resolved_by_id"], name: "index_trade_disputes_on_resolved_by_id"
    t.index ["trade_order_id", "status"], name: "index_trade_disputes_on_trade_order_id_and_status"
    t.index ["trade_order_id"], name: "index_trade_disputes_on_trade_order_id"
  end

  create_table "trade_events", force: :cascade do |t|
    t.integer "actor_id"
    t.datetime "created_at", null: false
    t.json "details", default: {}, null: false
    t.string "event_type", null: false
    t.integer "request_for_quote_id"
    t.integer "trade_order_id"
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_trade_events_on_actor_id"
    t.index ["request_for_quote_id"], name: "index_trade_events_on_request_for_quote_id"
    t.index ["trade_order_id", "created_at"], name: "index_trade_events_on_trade_order_id_and_created_at"
    t.index ["trade_order_id"], name: "index_trade_events_on_trade_order_id"
  end

  create_table "trade_milestones", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "funded_at"
    t.string "name", null: false
    t.string "release_condition", null: false
    t.datetime "released_at"
    t.integer "sequence", null: false
    t.string "status", default: "pending", null: false
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["trade_order_id", "sequence"], name: "index_trade_milestones_on_trade_order_id_and_sequence", unique: true
  end

  create_table "trade_order_acceptances", force: :cascade do |t|
    t.datetime "accepted_at", null: false
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.integer "organization_id", null: false
    t.string "role", null: false
    t.string "terms_sha256", null: false
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.text "user_agent"
    t.integer "user_id", null: false
    t.index ["organization_id"], name: "index_trade_order_acceptances_on_organization_id"
    t.index ["trade_order_id", "organization_id"], name: "index_acceptances_on_trade_order_and_organization", unique: true
    t.index ["user_id"], name: "index_trade_order_acceptances_on_user_id"
  end

  create_table "trade_orders", force: :cascade do |t|
    t.integer "buyer_organization_id", null: false
    t.datetime "cancelled_at"
    t.datetime "completed_at"
    t.datetime "contract_generated_at"
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.datetime "delivered_at"
    t.datetime "delivery_due_at"
    t.string "destination_port"
    t.datetime "disputed_at"
    t.datetime "funded_at"
    t.string "incoterm"
    t.boolean "inspection_required", default: false, null: false
    t.integer "inspection_window_days", default: 7, null: false
    t.integer "quotation_id", null: false
    t.string "reference", null: false
    t.datetime "refunded_at"
    t.integer "request_for_quote_id", null: false
    t.integer "shipping_cents", default: 0, null: false
    t.text "specifications"
    t.string "status", default: "awaiting_acceptance", null: false
    t.integer "subtotal_cents", null: false
    t.integer "supplier_organization_id", null: false
    t.json "terms", default: {}, null: false
    t.string "terms_sha256", null: false
    t.integer "total_cents", null: false
    t.datetime "updated_at", null: false
    t.integer "vendor_id", null: false
    t.index ["buyer_organization_id", "status"], name: "index_trade_orders_on_buyer_organization_id_and_status"
    t.index ["buyer_organization_id"], name: "index_trade_orders_on_buyer_organization_id"
    t.index ["quotation_id"], name: "index_trade_orders_on_quotation_id"
    t.index ["reference"], name: "index_trade_orders_on_reference", unique: true
    t.index ["request_for_quote_id"], name: "index_trade_orders_on_request_for_quote_id"
    t.index ["supplier_organization_id", "status"], name: "index_trade_orders_on_supplier_organization_id_and_status"
    t.index ["supplier_organization_id"], name: "index_trade_orders_on_supplier_organization_id"
    t.index ["vendor_id"], name: "index_trade_orders_on_vendor_id"
  end

  create_table "trade_shipments", force: :cascade do |t|
    t.string "carrier"
    t.datetime "created_at", null: false
    t.datetime "delivered_at"
    t.datetime "delivery_verified_at"
    t.json "documents", default: {}, null: false
    t.datetime "shipped_at"
    t.string "status", default: "awaiting_shipment", null: false
    t.string "tracking_number"
    t.integer "trade_order_id", null: false
    t.datetime "updated_at", null: false
    t.integer "verified_by_id"
    t.index ["trade_order_id"], name: "index_trade_shipments_on_trade_order_id", unique: true
    t.index ["verified_by_id"], name: "index_trade_shipments_on_verified_by_id"
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
    t.datetime "applied_at"
    t.text "bio"
    t.string "business_registration"
    t.string "city"
    t.decimal "commission_rate", precision: 5, scale: 4, default: "0.15", null: false
    t.string "contact_name"
    t.string "contact_phone"
    t.string "country"
    t.datetime "created_at", null: false
    t.integer "organization_id"
    t.string "payout_method"
    t.string "product_focus"
    t.string "review_note"
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "slug", null: false
    t.integer "status", default: 0, null: false
    t.string "store_name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "website"
    t.index ["organization_id"], name: "index_vendors_on_organization_id"
    t.index ["reviewed_by_id"], name: "index_vendors_on_reviewed_by_id"
    t.index ["slug"], name: "index_vendors_on_slug", unique: true
    t.index ["status", "applied_at"], name: "index_vendors_on_status_and_applied_at"
    t.index ["user_id"], name: "index_vendors_on_user_id", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "conversations", "orders"
  add_foreign_key "conversations", "products"
  add_foreign_key "conversations", "users", column: "buyer_id"
  add_foreign_key "conversations", "vendors"
  add_foreign_key "delivery_acceptances", "organizations"
  add_foreign_key "delivery_acceptances", "trade_orders"
  add_foreign_key "delivery_acceptances", "users"
  add_foreign_key "dispute_evidence", "trade_disputes"
  add_foreign_key "dispute_evidence", "users", column: "submitted_by_id"
  add_foreign_key "dispute_resolutions", "trade_disputes"
  add_foreign_key "dispute_resolutions", "users", column: "resolved_by_id"
  add_foreign_key "financial_movements", "protected_payments"
  add_foreign_key "financial_movements", "trade_orders"
  add_foreign_key "inspection_reports", "inspections"
  add_foreign_key "inspection_reports", "users", column: "submitted_by_id"
  add_foreign_key "inspections", "trade_orders"
  add_foreign_key "inspections", "users", column: "reviewed_by_id"
  add_foreign_key "inspections", "users", column: "submitted_by_id"
  add_foreign_key "messages", "conversations"
  add_foreign_key "messages", "users", column: "sender_id"
  add_foreign_key "notifications", "organizations"
  add_foreign_key "notifications", "users"
  add_foreign_key "order_events", "order_items"
  add_foreign_key "order_events", "orders"
  add_foreign_key "order_events", "users", column: "actor_id"
  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "products"
  add_foreign_key "order_items", "vendors"
  add_foreign_key "orders", "users", column: "buyer_id"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "organizations", "users", column: "verified_by_id"
  add_foreign_key "payouts", "order_items"
  add_foreign_key "payouts", "vendors"
  add_foreign_key "price_tiers", "products"
  add_foreign_key "products", "categories"
  add_foreign_key "products", "vendors"
  add_foreign_key "protected_payments", "trade_orders"
  add_foreign_key "provider_accounts", "organizations"
  add_foreign_key "quotation_items", "products"
  add_foreign_key "quotation_items", "quotations"
  add_foreign_key "quotations", "quotations", column: "supersedes_id"
  add_foreign_key "quotations", "request_for_quotes"
  add_foreign_key "quotations", "vendors"
  add_foreign_key "refund_requests", "order_items"
  add_foreign_key "refund_requests", "orders"
  add_foreign_key "refund_requests", "users", column: "buyer_id"
  add_foreign_key "refund_requests", "users", column: "resolved_by_id"
  add_foreign_key "request_for_quote_items", "products"
  add_foreign_key "request_for_quote_items", "request_for_quotes"
  add_foreign_key "request_for_quotes", "organizations"
  add_foreign_key "request_for_quotes", "products"
  add_foreign_key "request_for_quotes", "users", column: "buyer_id"
  add_foreign_key "reviews", "order_items"
  add_foreign_key "reviews", "products"
  add_foreign_key "reviews", "users", column: "buyer_id"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "supplier_capabilities", "categories"
  add_foreign_key "supplier_capabilities", "vendors"
  add_foreign_key "supplier_invitations", "request_for_quotes"
  add_foreign_key "supplier_invitations", "vendors"
  add_foreign_key "trade_disputes", "trade_orders"
  add_foreign_key "trade_disputes", "users", column: "opened_by_id"
  add_foreign_key "trade_disputes", "users", column: "resolved_by_id"
  add_foreign_key "trade_events", "request_for_quotes"
  add_foreign_key "trade_events", "trade_orders"
  add_foreign_key "trade_events", "users", column: "actor_id"
  add_foreign_key "trade_milestones", "trade_orders"
  add_foreign_key "trade_order_acceptances", "organizations"
  add_foreign_key "trade_order_acceptances", "trade_orders"
  add_foreign_key "trade_order_acceptances", "users"
  add_foreign_key "trade_orders", "organizations", column: "buyer_organization_id"
  add_foreign_key "trade_orders", "organizations", column: "supplier_organization_id"
  add_foreign_key "trade_orders", "quotations"
  add_foreign_key "trade_orders", "request_for_quotes"
  add_foreign_key "trade_orders", "vendors"
  add_foreign_key "trade_shipments", "trade_orders"
  add_foreign_key "trade_shipments", "users", column: "verified_by_id"
  add_foreign_key "vendors", "organizations"
  add_foreign_key "vendors", "users"
  add_foreign_key "vendors", "users", column: "reviewed_by_id"
end
