var cdb = require('cartodb.js');
var WidgetListItemView = require('./item-view');

/**
 * View to render a set of list items
 * this.model is a dataviewModel
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-list js-list',
  tagName: 'ul',

  events: {
    'scroll': '_checkScroll'
  },

  render: function () {
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function () {
    this.model.getData().each(this._addItem, this);
  },

  _addItem: function (mdl) {
    var v = new WidgetListItemView({
      model: mdl,
      dataviewModel: this.model
    });
    v.bind('itemClicked', function () {
      this.trigger('itemClicked', mdl, this);
    }, this);
    this.addView(v);
    this.$el.append(v.render().el);
  }

});
