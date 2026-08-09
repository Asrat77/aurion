module Api
  module V1
    module Business
      class TradeOrdersController < BaseController
        before_action :set_trade_order, only: [ :show, :contract, :acceptance, :protected_payment, :sandbox_funding,
                                                 :inspection_report, :shipment, :delivery_acceptance, :dispute, :cancellation,
                                                 :dispute_evidence ]

        def index
          organizations = current_user.organizations.active
          orders = TradeOrder.where(buyer_organization: organizations)
                             .or(TradeOrder.where(supplier_organization: organizations))
                             .includes(:vendor, :protected_payment, :inspection, :shipment)
                             .reverse_chronologically
          render json: orders.distinct.map { |trade_order| TradeOrderSerializer.render(trade_order, include_events: false) }
        end

        def show
          render json: TradeOrderSerializer.render(@trade_order)
        end

        def contract
          return render json: { message: "Contract not found" }, status: :not_found unless @trade_order.contract_document.attached?

          send_data @trade_order.contract_document.download,
                    filename: @trade_order.contract_document.filename.to_s,
                    type: "application/pdf", disposition: "inline"
        end

        def acceptance
          organization = current_user.organizations.active.find(params[:organization_id])
          require_member!(organization)
          return if performed?

          @trade_order.accept!(user: current_user, organization: organization, role: params[:role],
                              ip_address: request.remote_ip, user_agent: request.user_agent)
          render json: TradeOrderSerializer.render(@trade_order.reload)
        end

        def protected_payment
          return render json: { message: "Only a buyer finance representative may create a protected payment." }, status: :forbidden unless buyer_transactor?
          return render json: { message: "Both parties must accept the contract first." }, status: :unprocessable_entity unless @trade_order.fully_accepted?

          provider = ProtectedPayments::Provider.for(@trade_order)
          return render json: { message: "A live protected-payment provider is not configured." }, status: :service_unavailable unless provider.available?

          payment = @trade_order.protected_payment || @trade_order.create_protected_payment!(provider: provider.name,
                                                                                             currency: @trade_order.currency,
                                                                                             amount_cents: @trade_order.total_cents,
                                                                                             status: :funding_pending)
          render json: { provider: payment.provider, status: payment.status, amountCents: payment.amount_cents,
                         currency: payment.currency, action: provider.funding_action(payment) }
        end

        def sandbox_funding
          return render json: { message: "Only a buyer finance representative may fund a protected trade." }, status: :forbidden unless buyer_transactor?
          provider = ProtectedPayments::Provider.for(@trade_order)
          return render json: { message: "Sandbox funding is disabled." }, status: :not_found unless provider.name == "sandbox" && provider.available?

          result = provider.fund!
          render json: result
        end

        def inspection_report
          return render json: { message: "Only the supplier may submit inspection evidence." }, status: :forbidden unless supplier_member?
          inspection = @trade_order.inspection || @trade_order.create_inspection!(status: :awaiting_evidence)
          report = inspection.reports.create!(submitted_by: current_user, body: params.require(:body),
                                              evidence: params[:evidence] || {},
                                              version: inspection.reports.maximum(:version).to_i + 1)
          report.evidence_files.attach(Array(params[:evidence_files])) if params[:evidence_files].present?
          inspection.update!(status: :under_review, submitted_by: current_user)
          @trade_order.record_event!("inspection.submitted", actor: current_user,
                                     details: { report_id: report.id })
          render json: { id: report.id, version: report.version, sha256: report.sha256, status: inspection.status }, status: :created
        end

        def shipment
          return render json: { message: "Only the supplier may record shipment." }, status: :forbidden unless supplier_member?
          return render json: { message: "The trade must be funded before shipment." }, status: :unprocessable_entity unless @trade_order.funded?
          return render json: { message: "Inspection must pass or be waived first." }, status: :unprocessable_entity unless @trade_order.inspection_passed?

          shipment = @trade_order.shipment || @trade_order.create_shipment!
          shipment.ship!(carrier: params[:carrier], tracking_number: params[:tracking_number])
          shipment.documents.attach(Array(params[:documents])) if params[:documents].present?
          render json: TradeOrderSerializer.render(@trade_order.reload)
        end

        def delivery_acceptance
          organization = current_user.organizations.active.find(params[:organization_id])
          @trade_order.accept_delivery!(user: current_user, organization: organization)
          render json: TradeOrderSerializer.render(@trade_order.reload)
        end

        def dispute
          dispute = @trade_order.open_dispute!(user: current_user, reason: params.require(:reason),
                                               detail: params.require(:detail), amount_cents: params[:amount_cents].presence || @trade_order.total_cents)
          render json: { id: dispute.id, status: dispute.status, amountCents: dispute.amount_cents }, status: :created
        end

        def cancellation
          organization = current_user.organizations.active.find(params[:organization_id])
          @trade_order.cancel!(user: current_user, organization: organization)
          payment = @trade_order.protected_payment
          provider = ProtectedPayments::Provider.for(@trade_order)
          if payment&.funded? && provider.name == "sandbox" && provider.available?
            provider.refund!(amount_cents: payment.releasable_cents)
          end
          render json: TradeOrderSerializer.render(@trade_order.reload)
        end

        def dispute_evidence
          dispute = @trade_order.disputes.find(params.require(:dispute_id))
          return render json: { message: "Not found" }, status: :not_found unless buyer_member? || supplier_member?

          evidence = dispute.evidence.create!(submitted_by: current_user, body: params.require(:body),
                                              attachments: params[:attachments] || {})
          evidence.evidence_files.attach(Array(params[:files])) if params[:files].present?
          render json: { id: evidence.id, disputeId: dispute.id, body: evidence.body,
                         submittedBy: current_user.name, createdAt: evidence.created_at.iso8601 }, status: :created
        end

        private

        def set_trade_order
          @trade_order = TradeOrder.includes(:vendor, :acceptances, :protected_payment, :inspection, :shipment, :disputes).find(params[:id])
          return if current_user.organizations.active.where(id: [ @trade_order.buyer_organization_id, @trade_order.supplier_organization_id ]).exists?

          render json: { message: "Not found" }, status: :not_found
        end

        def supplier_member?
          @trade_order.supplier_organization.transact_as?(current_user)
        end

        def buyer_transactor?
          @trade_order.buyer_organization.transact_as?(current_user)
        end

        def buyer_member?
          @trade_order.buyer_organization.member?(current_user)
        end
      end
    end
  end
end
