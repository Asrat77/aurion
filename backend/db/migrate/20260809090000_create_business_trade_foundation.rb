class CreateBusinessTradeFoundation < ActiveRecord::Migration[8.1]
  def change
    create_table :organizations do |t|
      t.string :name, null: false
      t.string :legal_name
      t.string :kind, null: false, default: "buyer"
      t.string :status, null: false, default: "pending"
      t.string :verification_status, null: false, default: "unverified"
      t.string :registration_number
      t.string :country
      t.datetime :verified_at
      t.references :verified_by, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :organizations, [ :kind, :status ]
    add_index :organizations, :registration_number, unique: true, where: "registration_number IS NOT NULL"

    create_table :organization_memberships do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false, default: "buyer"
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :organization_memberships, [ :organization_id, :user_id ], unique: true,
              name: "index_memberships_on_organization_and_user"

    add_reference :vendors, :organization, foreign_key: true
    add_column :products, :express_enabled, :boolean, null: false, default: true
    add_column :products, :business_enabled, :boolean, null: false, default: false
    execute "UPDATE products SET business_enabled = TRUE WHERE moq IS NOT NULL"
    add_reference :request_for_quotes, :buyer, foreign_key: { to_table: :users }
    add_reference :request_for_quotes, :organization, foreign_key: true
    add_column :request_for_quotes, :currency, :string, null: false, default: "USD"

    create_table :request_for_quote_items do |t|
      t.references :request_for_quote, null: false, foreign_key: true
      t.references :product, foreign_key: true
      t.string :description, null: false
      t.integer :quantity, null: false
      t.string :unit_of_measure
      t.text :specifications

      t.timestamps
    end

    create_table :supplier_capabilities do |t|
      t.references :vendor, null: false, foreign_key: true
      t.references :category, foreign_key: true
      t.json :destinations, null: false, default: []
      t.integer :min_quantity
      t.integer :max_quantity
      t.integer :max_lead_time_days
      t.boolean :verified, null: false, default: false
      t.text :notes

      t.timestamps
    end

    create_table :supplier_invitations do |t|
      t.references :request_for_quote, null: false, foreign_key: true
      t.references :vendor, null: false, foreign_key: true
      t.integer :score, null: false
      t.json :reasons, null: false, default: []
      t.string :status, null: false, default: "invited"
      t.datetime :invited_at, null: false
      t.datetime :responded_at

      t.timestamps
    end

    add_index :supplier_invitations, [ :request_for_quote_id, :vendor_id ], unique: true,
              name: "index_invitations_on_rfq_and_vendor"
    add_index :supplier_invitations, [ :request_for_quote_id, :score ]

    create_table :quotations do |t|
      t.references :request_for_quote, null: false, foreign_key: true
      t.references :vendor, null: false, foreign_key: true
      t.references :supersedes, foreign_key: { to_table: :quotations }
      t.integer :revision, null: false, default: 1
      t.string :status, null: false, default: "draft"
      t.string :currency, null: false, default: "USD"
      t.string :incoterm
      t.integer :lead_time_days
      t.integer :shipping_cents, null: false, default: 0
      t.integer :total_cents, null: false, default: 0
      t.datetime :valid_until
      t.text :note
      t.datetime :submitted_at
      t.datetime :accepted_at
      t.datetime :withdrawn_at

      t.timestamps
    end

    add_index :quotations, [ :request_for_quote_id, :vendor_id, :revision ], unique: true,
              name: "index_quotations_on_rfq_vendor_revision"
    add_index :quotations, [ :request_for_quote_id, :status ]

    create_table :quotation_items do |t|
      t.references :quotation, null: false, foreign_key: true
      t.references :product, foreign_key: true
      t.string :description, null: false
      t.integer :quantity, null: false
      t.integer :unit_price_cents, null: false
      t.integer :line_total_cents, null: false
      t.string :currency, null: false, default: "USD"

      t.timestamps
    end

    create_table :trade_orders do |t|
      t.references :request_for_quote, null: false, foreign_key: true
      t.references :quotation, null: false, foreign_key: true
      t.references :buyer_organization, null: false, foreign_key: { to_table: :organizations }
      t.references :supplier_organization, null: false, foreign_key: { to_table: :organizations }
      t.references :vendor, null: false, foreign_key: true
      t.string :reference, null: false
      t.string :status, null: false, default: "awaiting_acceptance"
      t.string :currency, null: false, default: "USD"
      t.integer :subtotal_cents, null: false
      t.integer :shipping_cents, null: false, default: 0
      t.integer :total_cents, null: false
      t.string :incoterm
      t.string :destination_port
      t.text :specifications
      t.json :terms, null: false, default: {}
      t.string :terms_sha256, null: false
      t.boolean :inspection_required, null: false, default: false
      t.integer :inspection_window_days, null: false, default: 7
      t.datetime :delivery_due_at
      t.datetime :funded_at
      t.datetime :delivered_at
      t.datetime :completed_at
      t.datetime :disputed_at
      t.datetime :cancelled_at
      t.datetime :refunded_at

      t.timestamps
    end

    add_index :trade_orders, :reference, unique: true
    add_index :trade_orders, [ :buyer_organization_id, :status ]
    add_index :trade_orders, [ :supplier_organization_id, :status ]

    create_table :trade_order_acceptances do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false
      t.string :terms_sha256, null: false
      t.string :ip_address
      t.text :user_agent
      t.datetime :accepted_at, null: false

      t.timestamps
    end

    add_index :trade_order_acceptances, [ :trade_order_id, :organization_id ], unique: true,
              name: "index_acceptances_on_trade_order_and_organization"

    create_table :trade_milestones do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.integer :sequence, null: false
      t.string :name, null: false
      t.integer :amount_cents, null: false
      t.string :release_condition, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :funded_at
      t.datetime :released_at

      t.timestamps
    end

    add_index :trade_milestones, [ :trade_order_id, :sequence ], unique: true

    create_table :provider_accounts do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :provider, null: false
      t.string :external_account_id, null: false
      t.string :verification_status, null: false, default: "pending"
      t.boolean :payout_capability, null: false, default: false
      t.json :metadata, null: false, default: {}
      t.datetime :synced_at

      t.timestamps
    end

    add_index :provider_accounts, [ :provider, :external_account_id ], unique: true

    create_table :protected_payments do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.string :provider, null: false
      t.string :external_id
      t.string :status, null: false, default: "created"
      t.string :currency, null: false
      t.integer :amount_cents, null: false
      t.json :metadata, null: false, default: {}
      t.datetime :funded_at
      t.datetime :release_requested_at
      t.datetime :released_at
      t.datetime :refunded_at
      t.datetime :last_synced_at

      t.timestamps
    end

    add_index :protected_payments, :trade_order_id, unique: true
    add_index :protected_payments, [ :provider, :external_id ], unique: true,
              where: "external_id IS NOT NULL"

    create_table :provider_events do |t|
      t.string :provider, null: false
      t.string :external_event_id, null: false
      t.string :event_type, null: false
      t.string :payload_checksum, null: false
      t.json :payload, null: false, default: {}
      t.string :status, null: false, default: "received"
      t.integer :attempts, null: false, default: 0
      t.datetime :processed_at
      t.text :error

      t.timestamps
    end

    add_index :provider_events, [ :provider, :external_event_id ], unique: true

    create_table :financial_movements do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.references :protected_payment, foreign_key: true
      t.string :movement_type, null: false
      t.integer :amount_cents, null: false
      t.string :currency, null: false
      t.string :external_reference
      t.json :metadata, null: false, default: {}
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :financial_movements, [ :trade_order_id, :movement_type, :external_reference ],
              unique: true, name: "index_movements_on_trade_type_reference"

    create_table :idempotency_records do |t|
      t.string :scope_key, null: false
      t.string :key, null: false
      t.string :request_hash, null: false
      t.string :resource_type
      t.bigint :resource_id
      t.integer :response_status, null: false
      t.json :response_body, null: false, default: {}

      t.timestamps
    end

    add_index :idempotency_records, [ :scope_key, :key ], unique: true

    create_table :trade_events do |t|
      t.references :trade_order, foreign_key: true
      t.references :request_for_quote, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.json :details, null: false, default: {}

      t.timestamps
    end

    add_index :trade_events, [ :trade_order_id, :created_at ]

    create_table :inspections do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.references :submitted_by, foreign_key: { to_table: :users }
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "awaiting_evidence"
      t.string :outcome
      t.text :notes
      t.datetime :reviewed_at

      t.timestamps
    end

    create_table :inspection_reports do |t|
      t.references :inspection, null: false, foreign_key: true
      t.references :submitted_by, null: false, foreign_key: { to_table: :users }
      t.integer :version, null: false
      t.text :body, null: false
      t.json :evidence, null: false, default: {}
      t.string :sha256, null: false

      t.timestamps
    end

    add_index :inspection_reports, [ :inspection_id, :version ], unique: true

    create_table :trade_shipments do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.string :carrier
      t.string :tracking_number
      t.string :status, null: false, default: "awaiting_shipment"
      t.datetime :shipped_at
      t.datetime :delivered_at
      t.datetime :delivery_verified_at
      t.references :verified_by, foreign_key: { to_table: :users }
      t.json :documents, null: false, default: {}

      t.timestamps
    end

    add_index :trade_shipments, :trade_order_id, unique: true

    create_table :delivery_acceptances do |t|
      t.references :trade_order, null: false, foreign_key: true, index: false
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :accepted_at, null: false

      t.timestamps
    end

    add_index :delivery_acceptances, :trade_order_id, unique: true

    create_table :trade_disputes do |t|
      t.references :trade_order, null: false, foreign_key: true
      t.references :opened_by, null: false, foreign_key: { to_table: :users }
      t.references :resolved_by, foreign_key: { to_table: :users }
      t.string :reason, null: false
      t.string :status, null: false, default: "open"
      t.integer :amount_cents, null: false
      t.text :detail, null: false
      t.text :resolution_note
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :trade_disputes, [ :trade_order_id, :status ]

    create_table :dispute_evidence do |t|
      t.references :trade_dispute, null: false, foreign_key: true
      t.references :submitted_by, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false
      t.json :attachments, null: false, default: {}

      t.timestamps
    end

    create_table :dispute_resolutions do |t|
      t.references :trade_dispute, null: false, foreign_key: true
      t.references :resolved_by, null: false, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.integer :refund_cents, null: false, default: 0
      t.integer :release_cents, null: false, default: 0
      t.text :note

      t.timestamps
    end

    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :organization, foreign_key: true
      t.string :kind, null: false
      t.string :title, null: false
      t.text :body, null: false
      t.datetime :read_at
      t.json :data, null: false, default: {}

      t.timestamps
    end

    add_index :notifications, [ :user_id, :read_at, :created_at ]
  end
end
