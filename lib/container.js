/*!
 * The Container provides the top-level Context to any component that applies
 * the Littlest-Isomorph Mixin. This component should only be used from
 * Renderers, and is not made available to users of Littlest-Isomorph.
 */
var React = require('react');
var Context = require('./context');

/**
 * The set of Context functions made available through the Mixin to any
 * interested component.
 */
var AVAILABLE_FUNCTIONS = [
  'performAction',
  'getStore',
  'getRouteUrl',
  'navigateToRoute'
];

var Container = React.createClass({
  /**
   * Since we don't use JSX for our transparent little component, we need
   * to manually set a displayName.
   */
  displayName: 'Littlest-Isomorph',

  /**
   * Internal-only expectations from Renderers, Navigators, etc.
   */
  propTypes: {
    component: React.PropTypes.func,
    context: React.PropTypes.instanceOf(Context),
    route: React.PropTypes.object
  },

  /**
   * Make our set of available functions available to the Mixin.
   */
  statics: {
    AVAILABLE_FUNCTIONS: AVAILABLE_FUNCTIONS
  },

  /**
   * Provide all available functions through the child React Context.
   */
  childContextTypes: AVAILABLE_FUNCTIONS.reduce(function (types, key) {
    types[key] = React.PropTypes.func;
    return types;
  }, {}),

  /**
   * Provide all available functions through the child React Context.
   */
  getChildContext: function () {
    var self = this;

    return self.props.context && AVAILABLE_FUNCTIONS.reduce(function (context, key) {
      context[key] = function (name, params) {
        return self.props.context[key](name, params);
      };
      return context;
    }, {});
  },

  /**
   * Render the configured top-level component with no wrapper Element
   * whatsoever. We don't want the Container to affect the DOM, though it will
   * be visible through the React DevTools.
   */
  render: function () {
    return React.createElement(this.props.component, { route: this.props.route, context: this.props.context });
  }
});

/*!
 * Export `Container`.
 */
module.exports = Container;
