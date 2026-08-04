Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      delete "auth/logout", to: "auth#logout"
      get "me", to: "me#show"
      patch "me", to: "me#update"
      delete "me", to: "me#destroy"

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
      end
    end
  end
end
