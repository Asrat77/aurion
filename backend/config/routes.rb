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

      resources :products, only: [ :index, :show ], param: :slug
      resources :categories, only: [ :index ]
      resources :orders, only: [ :index, :show, :create ]
      resources :request_for_quotes, only: [ :create ]

      post "payments/:order_id/intent", to: "payments#create"
      post "payments/:order_id/mock_confirm", to: "payments#mock_confirm"

      namespace :vendor do
        get "overview", to: "overview#show"
        resources :products, only: [ :index, :create, :update, :destroy ]
        resources :orders, only: [ :index ]
        resources :payouts, only: [ :index ]
      end

      namespace :admin do
        get "overview", to: "overview#show"
        resources :orders, only: [ :index ]
        resources :customers, only: [ :index ]
        resources :vendors, only: [ :index ]
        resources :products, only: [ :index ]
        resources :request_for_quotes, only: [ :index ]
        get "analytics", to: "analytics#show"
      end
    end
  end
end
