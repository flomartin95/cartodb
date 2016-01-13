var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var ItemsView = require('../../../src/widgets/category/list/items-view');

describe('widgets/category/items-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.dataviewModel = vis.dataviews.createCategoryDataview(vis.map.layers.first(), {});
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new ItemsView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
  });

  describe('render', function () {
    it('should render placeholder when data is empty', function () {
      spyOn(this.view, '_renderPlaceholder').and.callThrough();
      this.view.render();
      expect(this.view._renderPlaceholder).toHaveBeenCalled();
      expect(this.view.$el.hasClass('CDB-Widget-list--withBorders')).toBeTruthy();
      expect(this.view.$el.hasClass('CDB-Widget-list--wrapped')).toBeFalsy();
    });

    describe('when have at least one category', function () {
      beforeEach(function () {
        this.dataviewModel.sync = function (method, model, options) {
          options.success({
            'categories': [
              {category: 'Hey'},
              {category: 'test'}
            ]
          });
        };
        this.dataviewModel.fetch();
        this.view.render();
      });

      it('should render properly a list of categories', function () {
        expect(this.view.$('.CDB-Widget-listGroup').length).toBe(1);
        expect(this.view.$('.CDB-Widget-listItem').length).toBe(2);
        expect(this.view.$el.hasClass('CDB-Widget-list--withBorders')).toBeFalsy();
      });
    });
  });

  describe('bind', function () {
    beforeEach(function () {
      spyOn(this.dataviewModel, 'bind');
      spyOn(this.widgetModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any data has changed (origin or search data)', function () {
      var bind = this.dataviewModel.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:data change:searchData');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should toggle view when search is enabled/disabled', function () {
      var bind = this.widgetModel.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:search');
      expect(bind[1]).toEqual(this.view.toggle);
    });
  });
});
