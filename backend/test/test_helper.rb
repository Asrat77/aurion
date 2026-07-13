ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors)
    # No fixture files — tests build the data they need explicitly via
    # Model.create!, which is clearer given how interdependent the
    # marketplace models are (products need vendors need users).
  end
end
