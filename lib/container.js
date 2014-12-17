var React = require('react');
var Context = require('./context');

var Container = React.createClass({
  displayName: 'Littlest-Isomorph',
  childContextTypes: {
    performAction: React.PropTypes.func,
    getStore: React.PropTypes.func,
    getRouteUrl: React.PropTypes.func,
    navigateToRoute: React.PropTypes.func
  },
  propTypes: {
    component: React.PropTypes.func,
    context: React.PropTypes.instanceOf(Context),
    route: React.PropTypes.object
  },
  getChildContext: function () {
    var self = this;

    return self.props.context && {
      performAction: function (name, params) {
        return self.props.context.performAction(name, params);
      },
      getStore: function (name) {
        return self.props.context.getStore(name);
      },
      getRouteUrl: function (name, params) {
        return self.props.context.getRouteUrl(name, params);
      },
      navigateToRoute: function (name, params) {
        return self.props.context.navigateToRoute(name, params);
      }
    };
  },
  render: function () {
    return React.createElement(this.props.component, { route: this.props.route, context: this.props.context });
  }
});

module.exports = Container;
