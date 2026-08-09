module Api
  module V1
    module Admin
      class BusinessController < BaseController
        before_action :require_idempotency_key!, if: :state_changing_request?
        around_action :with_idempotency, if: :state_changing_request?

        def inspections
          render json: Inspection.includes(:trade_order, :reports).order(created_at: :desc).map { |inspection|
            { id: inspection.id, tradeOrderId: inspection.trade_order_id, status: inspection.status,
              outcome: inspection.outcome, notes: inspection.notes,
              reports: inspection.reports.order(:version).map { |report|
                { id: report.id, version: report.version, body: report.body, sha256: report.sha256,
                  submittedBy: report.submitted_by_id, createdAt: report.created_at.iso8601 }
              } }
          }
        end

        def review_inspection
          inspection = Inspection.find(params[:id])
          case params.require(:decision)
          when "pass"
            inspection.pass!(admin: current_user, notes: params[:notes])
          when "fail"
            inspection.fail!(admin: current_user, notes: params[:notes])
          when "waive"
            inspection.waive!(admin: current_user, notes: params[:notes])
          else
            return render json: { message: "Choose pass, fail, or waive." }, status: :unprocessable_entity
          end
          render json: { id: inspection.id, status: inspection.reload.status, outcome: inspection.outcome }
        end

        def verify_delivery
          shipment = TradeShipment.find(params[:id])
          shipment.verify_delivery!(admin: current_user)
          render json: TradeOrderSerializer.render(shipment.trade_order.reload)
        end

        def disputes
          render json: TradeDispute.includes(:trade_order, :opened_by).order(created_at: :desc).map { |dispute|
            { id: dispute.id, tradeOrderId: dispute.trade_order_id, reference: dispute.trade_order.reference,
              status: dispute.status, reason: dispute.reason, detail: dispute.detail,
              amountCents: dispute.amount_cents, openedBy: dispute.opened_by.email,
              createdAt: dispute.created_at.iso8601 }
          }
        end

        def provider_events
          events = ProviderEvent.where(status: %w[received failed processing]).order(created_at: :desc).limit(200)
          render json: events.map { |event|
            { id: event.id, provider: event.provider, externalEventId: event.external_event_id,
              eventType: event.event_type, status: event.status, attempts: event.attempts,
              error: event.error, createdAt: event.created_at.iso8601 }
          }
        end

        def retry_provider_event
          event = ProviderEvent.find(params[:id])
          event.update!(status: :received, error: nil)
          ProcessProviderEventJob.perform_later(event.id)
          render json: { id: event.id, status: event.status }, status: :accepted
        end

        def resolve_dispute
          dispute = TradeDispute.find(params[:id])
          refund_cents = params[:refund_cents].to_i
          release_cents = params[:release_cents].to_i
          payment = dispute.trade_order.protected_payment
          return render json: { message: "A protected payment is required before resolution." }, status: :unprocessable_entity unless payment
          return render json: { message: "Resolution exceeds the amount still held." }, status: :unprocessable_entity if refund_cents + release_cents > payment.releasable_cents
          provider = ProtectedPayments::Provider.for(dispute.trade_order)
          return render json: { message: "A live protected-payment provider is required before resolution." }, status: :service_unavailable unless provider.available?

          dispute.resolve!(admin: current_user, refund_cents: refund_cents,
                           release_cents: release_cents, note: params[:note])
          trade_order = dispute.trade_order.reload

          if refund_cents.positive? && provider.name == "sandbox"
            provider.refund!(amount_cents: refund_cents)
          end
          if release_cents.positive? && provider.name == "sandbox"
            provider.release!(amount_cents: release_cents, force: true)
          end

          render json: TradeOrderSerializer.render(trade_order.reload)
        end

        def release
          trade_order = TradeOrder.find(params[:id])
          return render json: { message: "This trade is not eligible for release." }, status: :unprocessable_entity unless trade_order.release_allowed?
          provider = ProtectedPayments::Provider.for(trade_order)
          return render json: { message: "A live protected-payment provider is not configured." }, status: :service_unavailable unless provider.available?

          render json: provider.release!
        end
      end
    end
  end
end
