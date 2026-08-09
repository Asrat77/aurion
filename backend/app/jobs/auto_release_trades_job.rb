class AutoReleaseTradesJob < ApplicationJob
  queue_as :payments

  def perform
    TradeOrder.where(status: %w[delivered release_pending]).includes(:protected_payment).find_each do |trade_order|
      next unless trade_order.release_allowed?

      provider = ProtectedPayments::Provider.for(trade_order)
      provider.release! if provider.available?
    rescue StandardError => error
      Rails.logger.error("AURION auto-release #{trade_order.reference} failed: #{error.message}")
    end
  end
end
