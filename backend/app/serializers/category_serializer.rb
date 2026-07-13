class CategorySerializer
  def self.render(category)
    return nil unless category

    { id: category.id, name: category.name, slug: category.slug }
  end
end
