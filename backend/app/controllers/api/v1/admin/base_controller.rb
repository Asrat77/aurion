module Api
  module V1
    module Admin
      class BaseController < ApplicationController
        before_action { require_role(:admin) }
      end
    end
  end
end
