class AuthToken
  ALGORITHM = "HS256".freeze
  EXPIRY = 7.days

  def self.encode(user_id)
    payload = { sub: user_id, exp: EXPIRY.from_now.to_i }
    JWT.encode(payload, secret, ALGORITHM)
  end

  def self.decode(token)
    body = JWT.decode(token, secret, true, algorithm: ALGORITHM).first
    body["sub"]
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  def self.secret
    Rails.application.secret_key_base
  end
end
