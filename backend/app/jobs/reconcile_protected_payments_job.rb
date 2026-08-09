class ReconcileProtectedPaymentsJob < ApplicationJob
  queue_as :payments

  def perform
    ProtectedPayment.where(status: %w[funding_pending funded release_pending partially_released partially_refunded]).find_each do |payment|
      provider = ProtectedPayments::Provider.for(payment.trade_order)
      next unless provider.available? && provider.respond_to?(:reconcile!)

      provider.reconcile!(payment)
    rescue StandardError => error
      Rails.logger.error("AURION payment reconciliation #{payment.id} failed: #{error.message}")
    end
  end
end
