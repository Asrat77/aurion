class AddInspectionRequirementToRequestForQuotes < ActiveRecord::Migration[8.1]
  def change
    add_column :request_for_quotes, :inspection_required, :boolean, null: false, default: false
  end
end
