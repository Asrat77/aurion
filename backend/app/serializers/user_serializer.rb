class UserSerializer
  def self.render(user)
    return nil unless user

    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      vendor: user.vendor ? VendorSerializer.render(user.vendor) : nil
    }
  end
end
