class ProcessProviderEventJob < ApplicationJob
  queue_as :payments

  retry_on StandardError, wait: :exponentially_longer, attempts: 10

  def perform(provider_event_id)
    ProtectedPayments::WebhookProcessor.process_event!(ProviderEvent.find(provider_event_id))
  end
end
