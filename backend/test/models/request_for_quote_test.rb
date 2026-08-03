require "test_helper"

class RequestForQuoteTest < ActiveSupport::TestCase
  test "normalizes contact details and assigns a reference" do
    request_for_quote = RequestForQuote.create!(
      company_name: "  Habesha Imports  ",
      email: "  BUYER@EXAMPLE.COM ",
      product_interest: "  Yirgacheffe coffee  ",
    )

    assert_equal "Habesha Imports", request_for_quote.company_name
    assert_equal "buyer@example.com", request_for_quote.email
    assert_equal "Yirgacheffe coffee", request_for_quote.product_interest
    assert_match(/\ARFQ-\d{6}-[A-Z0-9]{6}\z/, request_for_quote.reference)
    assert_equal "new", request_for_quote.status
  end

  test "requires the commercial inquiry essentials" do
    request_for_quote = RequestForQuote.new

    assert_not request_for_quote.valid?
    assert request_for_quote.errors.added?(:company_name, :blank)
    assert request_for_quote.errors.added?(:email, :blank)
    assert request_for_quote.errors.added?(:product_interest, :blank)
  end
end
