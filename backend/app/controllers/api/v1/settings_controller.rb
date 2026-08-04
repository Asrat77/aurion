module Api
  module V1
    # Public, unauthenticated configuration the storefront needs before a buyer
    # has done anything — chiefly the birr rate, so prices can be shown in ETB
    # without waiting for a checkout quote.
    class SettingsController < ApplicationController
      def show
        render json: {
          baseCurrency: "USD",
          etbPerUsd: Pricing.etb_per_usd,
          freeShippingThresholdCents: Pricing::FREE_SHIPPING_THRESHOLD_CENTS,
          ethiopiaVatRate: Pricing::ETHIOPIA_VAT_RATE
        }
      end
    end
  end
end
