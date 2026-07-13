class ApplicationController < ActionController::API
  include ActionController::Cookies

  COOKIE_NAME = :aurion_jwt

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

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
      expires: AuthToken::EXPIRY.from_now,
    }
  end

  def sign_out
    cookies.delete(COOKIE_NAME, same_site: cookie_same_site, secure: Rails.env.production?)
  end

  private

  def cookie_same_site
    Rails.env.production? ? :none : :lax
  end

  def render_unauthorized
    render json: { message: "Please sign in to continue." }, status: :unauthorized
  end

  def render_not_found
    render json: { message: "Not found" }, status: :not_found
  end
end
