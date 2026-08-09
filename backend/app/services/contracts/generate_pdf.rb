require "prawn"
require "stringio"

module Contracts
  class GeneratePdf
    def self.call(trade_order)
      pdf = Prawn::Document.new(page_size: "A4", margin: 48)
      pdf.text "AURION PROTECTED TRADE", size: 20, style: :bold
      pdf.move_down 12
      pdf.text "Contract #{trade_order.reference}", size: 14, style: :bold
      pdf.move_down 16
      pdf.text "This sandbox contract records the commercial terms accepted by the buyer and supplier."
      pdf.move_down 12
      pdf.text "Terms digest: #{trade_order.terms_sha256}", size: 9
      pdf.move_down 12
      pdf.text "Currency: #{trade_order.currency}"
      pdf.text "Total: #{trade_order.total_cents} minor units"
      pdf.text "Incoterm: #{trade_order.incoterm.presence || 'Not specified'}"
      pdf.text "Destination: #{trade_order.destination_port.presence || 'Not specified'}"
      pdf.move_down 16
      pdf.text "Accepted line items", style: :bold
      trade_order.terms.fetch("items", []).each do |item|
        pdf.text "- #{item.fetch('quantity')} × #{item.fetch('description')} at #{item.fetch('unit_price_cents')} minor units"
      end
      pdf.move_down 24
      pdf.text "Provider-held funds, release, refunds, inspection, delivery, and dispute outcomes are governed by the AURION protected-trade state machine and provider events."

      trade_order.contract_document.attach(
        io: StringIO.new(pdf.render),
        filename: "#{trade_order.reference}.pdf",
        content_type: "application/pdf",
        identify: false
      )
      trade_order.update_columns(contract_generated_at: Time.current, updated_at: Time.current)
      trade_order
    end
  end
end
