require 'active_record'

module Carto
  class Overlay < ActiveRecord::Base
    # INFO: disable ActiveRecord inheritance column
    self.inheritance_column = :_type

    belongs_to :visualization

    serialize :options, JSON

    validates :type, presence: true
    validate :unique_overlay_not_duplicated
    validate :validate_user_not_viewer

    before_destroy :raise_error_if_user_viewer

    after_save :invalidate_cache
    after_destroy :invalidate_cache

    # There can be at most one of this types per visualization
    UNIQUE_TYPES = [
      'header', 'search', 'layer_selector', 'share', 'zoom', 'logo', 'loader', 'fullscreen'
    ].freeze

    def hide
      options['display'] = false
      self
    end

    def show
      options['display'] = true
      self
    end

    def hidden?
      !options['display']
    end

    private

    def unique_overlay_not_duplicated
      # This check probably belongs in visualization. See #6919
      if UNIQUE_TYPES.include?(type)
        other_overlay = Carto::Overlay.where(visualization_id: visualization_id, type: type)
        other_overlay = other_overlay.where('id != ?', id) unless new_record?

        unless other_overlay.first.nil?
          errors.add(:base, "Unique overlay of type #{type} already exists")
        end
      end
    end

    def validate_user_not_viewer
      # TODO: `visualization` check is needed because the creation of default overlays for visualization
      # is yet done from the old models (Member). Member assigns the id (because it can't assign itself, as
      # it's not a `Carto::Visualization`), but since that happens in a transaction managed by Sequel
      # we can't get the `Carto::Visualization` here. When `Member` is gone the `visualization` check can
      # be removed, as an `Overlay` must have a `Visualization`.
      errors.add(:visualization, "Viewer users can't add overlays") if visualization && visualization.user.viewer
    end

    def raise_error_if_user_viewer
      raise CartoDB::InvalidMember.new(user: "Viewer users can't destroy overlays") if visualization.user.viewer
    end

    def invalidate_cache
      CartoDB::Visualization::Member.new(id: visualization_id).fetch.invalidate_cache
    rescue KeyError
      # This happens during creation, as the overlays are created before the visualization
    end
  end
end
