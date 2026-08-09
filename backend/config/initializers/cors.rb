# Be sure to restart your server when you modify this file.

allowed_origins = ENV.fetch("FRONTEND_ORIGINS", ENV.fetch("FRONTEND_ORIGIN", "http://localhost:3000"))
                         .split(",")
                         .map(&:strip)
                         .reject(&:blank?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
