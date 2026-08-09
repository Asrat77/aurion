class ApplicationController < ActionController::API
  include ActionController::Cookies

  COOKIE_NAME = :aurion_jwt
  CSRF_COOKIE_NAME = :aurion_csrf

  before_action :issue_csrf_token
  before_action :verify_request_origin

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid

  def current_user
    return @current_user if defined?(@current_user)

    token = cookies.signed[COOKIE_NAME]
    user_id = token && AuthToken.decode(token)
    @current_user = user_id && User.find_by(id: user_id)
  end

  def authenticate!
    render_unauthorized unless current_user
  end

  def require_role(role)
    authenticate!
    return if performed?

    unless current_user.role == role.to_s
      render json: { message: "Forbidden" }, status: :forbidden
    end
  end

  def csrf_token
    cookies[CSRF_COOKIE_NAME]
  end

  # Frontend (Appwrite) and backend (Dokploy) are served from different
  # registrable domains in production, so the auth cookie is cross-site from
  # the browser's perspective. SameSite=Lax cookies aren't sent on cross-site
  # fetch/XHR requests, only top-level navigations, so login would silently
  # fail. SameSite=None (which requires Secure) is needed whenever the
  # frontend origin differs from the backend's own host. Locally both run on
  # localhost (differing only by port), which the Same-Site spec treats as
  # same-site, so Lax still works there.
  def sign_in(user)
    token = AuthToken.encode(user.id)
    cookies.signed[COOKIE_NAME] = {
      value: token,
      httponly: true,
      same_site: cookie_same_site,
      secure: Rails.env.production?,
      expires: AuthToken::EXPIRY.from_now
    }
  end

  def sign_out
    cookies.delete(COOKIE_NAME, same_site: cookie_same_site, secure: Rails.env.production?)
  end

  private

  def issue_csrf_token
    return if cookies[CSRF_COOKIE_NAME].present?

    cookies[CSRF_COOKIE_NAME] = {
      value: SecureRandom.urlsafe_base64(32),
      httponly: false,
      same_site: cookie_same_site,
      secure: Rails.env.production?,
      expires: 12.hours.from_now
    }
  end

  def verify_request_origin
    return if request.get? || request.head? || request.options?

    origin = request.headers["Origin"].presence
    return if origin.blank? && request.headers["Sec-Fetch-Site"].blank?

    if origin.present? && !allowed_frontend_origins.include?(origin)
      return render json: { message: "Request origin is not allowed." }, status: :forbidden
    end

    # An exact browser Origin is sufficient CSRF proof and keeps staggered
    # frontend/API deployments working when third-party cookies are blocked.
    return if origin.present?

    submitted_token = request.headers["X-CSRF-Token"].to_s
    issued_token = csrf_token.to_s
    return if submitted_token.present? && issued_token.present? &&
              submitted_token.bytesize == issued_token.bytesize &&
              ActiveSupport::SecurityUtils.secure_compare(submitted_token, issued_token)

    render json: { message: "CSRF token is missing or invalid." }, status: :forbidden
  end

  def allowed_frontend_origins
    @allowed_frontend_origins ||= ENV.fetch("FRONTEND_ORIGINS", ENV.fetch("FRONTEND_ORIGIN", "http://localhost:3000"))
                                           .split(",")
                                           .map(&:strip)
                                           .reject(&:blank?)
  end

  def cookie_same_site
    ENV.fetch("COOKIE_SAME_SITE", Rails.env.production? ? "none" : "lax").to_sym
  end

  def render_unauthorized
    render json: { message: "Please sign in to continue." }, status: :unauthorized
  end

  def render_not_found
    render json: { message: "Not found" }, status: :not_found
  end

  def render_record_invalid(error)
    render json: {
      message: error.record.errors.full_messages.to_sentence,
      errors: error.record.errors.to_hash
    }, status: :unprocessable_entity
  end

  def state_changing_request?
    request.post? || request.patch? || request.put? || request.delete?
  end

  def require_idempotency_key!
    key = request.headers["Idempotency-Key"].to_s.strip
    return if key.present? && key.length <= 128

    render json: { message: "Idempotency-Key is required for state-changing requests." }, status: :unprocessable_entity
  end

  def with_idempotency
    key = request.headers["Idempotency-Key"].to_s.strip
    scope_key = "user:#{current_user&.id || request.remote_ip}"
    request_hash = Digest::SHA256.hexdigest(request.raw_post.to_s)
    record = IdempotencyRecord.find_by(scope_key: scope_key, key: key)
    if record
      return render json: record.response_body, status: record.response_status if record.same_request?(request_hash)

      return render json: { message: "This idempotency key was already used with a different request." }, status: :conflict
    end

    yield
    return unless response.status >= 200 && response.status < 300

    body = begin
      JSON.parse(response.body.to_s)
    rescue JSON::ParserError
      { "raw" => response.body.to_s }
    end
    IdempotencyRecord.create!(scope_key: scope_key, key: key, request_hash: request_hash,
                              response_status: response.status, response_body: body)
  rescue ActiveRecord::RecordNotUnique
    existing = IdempotencyRecord.find_by(scope_key: scope_key, key: key)
    return render json: existing.response_body, status: existing.response_status if existing&.same_request?(request_hash)

    render json: { message: "This idempotency key was already used with a different request." }, status: :conflict
  end
end
