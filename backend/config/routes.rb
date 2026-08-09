Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      delete "auth/logout", to: "auth#logout"
      get "me", to: "me#show"
      resources :notifications, only: [ :index ] do
        post :read, on: :member
      end
      patch "me", to: "me#update"
      delete "me", to: "me#destroy"
      get "security/csrf", to: "security#csrf"

      resources :products, only: [ :index, :show ], param: :slug do
        get :facets, on: :collection
      end
      resources :categories, only: [ :index ]
      get "settings", to: "settings#show"
      resources :orders, only: [ :index, :show, :create ] do
        post :quote, on: :collection
        post :cancel, on: :member
      end
      resources :request_for_quotes, only: [ :create ] do
        get :catalogue, on: :collection
      end

      get "products/:product_slug/reviews", to: "reviews#index"
      get "reviews/pending", to: "reviews#pending"
      resources :reviews, only: [ :create ]

      resources :refund_requests, only: [ :index, :create ]

      get "vendor_application", to: "vendor_applications#show"
      post "vendor_application", to: "vendor_applications#create"

      resources :conversations, only: [ :index, :show, :create ] do
        post :reply, on: :member
      end

      post "payments/:order_id/intent", to: "payments#create"
      post "payments/:order_id/mock_confirm", to: "payments#mock_confirm"

      namespace :vendor do
        get "overview", to: "overview#show"
        get "analytics", to: "analytics#show"
        resources :products, only: [ :index, :create, :update, :destroy ]
        resources :orders, only: [ :index, :update ]
        resources :payouts, only: [ :index ]
      end

      namespace :business do
        # Public storefront reads: no session required to evaluate the network.
        get "network", to: "network#show"
        get "suppliers", to: "network#suppliers"
        resources :organizations, only: [ :index, :show, :create ] do
          resources :request_for_quotes, only: [ :create ], controller: "request_for_quotes"
          resources :memberships, only: [ :index, :create, :update, :destroy ], controller: "memberships"
        end
        resources :request_for_quotes, only: [ :index, :show, :create ] do
          post :publication, on: :member, to: "request_for_quotes#publish"
          get :matching, on: :member, to: "request_for_quotes#matching"
        end
        resources :opportunities, only: [ :index, :show ]
        resources :quotations, only: [ :index, :update ] do
          post :submission, on: :member, to: "quotations#submit"
          post :withdrawal, on: :member, to: "quotations#withdraw"
          post :acceptance, on: :member, to: "quotations#accept"
        end
        resources :opportunities, only: [] do
          resources :quotations, only: [ :create ], controller: "quotations"
        end
        resources :trade_orders, only: [ :index, :show ] do
          get :contract, on: :member, to: "trade_orders#contract"
          post :acceptance, on: :member, to: "trade_orders#acceptance"
          post :protected_payment, on: :member, to: "trade_orders#protected_payment"
          post :sandbox_funding, on: :member, to: "trade_orders#sandbox_funding"
          post :inspection_report, on: :member, to: "trade_orders#inspection_report"
          post :shipment, on: :member, to: "trade_orders#shipment"
          post :delivery_acceptance, on: :member, to: "trade_orders#delivery_acceptance"
          post :dispute, on: :member, to: "trade_orders#dispute"
          post :dispute_evidence, on: :member, to: "trade_orders#dispute_evidence"
          post :cancellation, on: :member, to: "trade_orders#cancellation"
        end
      end

      namespace :webhooks do
        post "payments/:provider", to: "payments#create"
      end

      namespace :admin do
        get "overview", to: "overview#show"
        resources :orders, only: [ :index ] do
          post :cancel, on: :member
        end
        resources :customers, only: [ :index ]
        resources :vendors, only: [ :index ]
        resources :products, only: [ :index ]
        resources :request_for_quotes, only: [ :index, :update ] do
          post :quote, on: :member
        end
        resources :reviews, only: [ :index, :update ]
        resources :vendor_applications, only: [ :index ] do
          post :approve, on: :member
          post :reject, on: :member
        end
        resources :refund_requests, only: [ :index ] do
          post :approve, on: :member
          post :reject, on: :member
        end
        get "analytics", to: "analytics#show"
        resources :organizations, only: [ :index ] do
          post :verification, on: :member, to: "organizations#verify"
        end
        get "business/sourcing", to: "business#sourcing"
        get "business/inspections", to: "business#inspections"
        post "business/inspections/:id/review", to: "business#review_inspection"
        post "business/shipments/:id/delivery_verification", to: "business#verify_delivery"
        get "business/disputes", to: "business#disputes"
        get "business/provider_events", to: "business#provider_events"
        post "business/provider_events/:id/retry", to: "business#retry_provider_event"
        post "business/disputes/:id/resolution", to: "business#resolve_dispute"
        post "business/trade_orders/:id/release", to: "business#release"
      end
    end
  end
end
