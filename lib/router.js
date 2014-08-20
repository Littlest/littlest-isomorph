/*!
 * Router.js is reponsible for loading and consistently rendering React
 * components based on a JSON route configuration file.
 */
var url = require('url');
var BaseRouter = require('routr');

/**
 * Creates a new instance of Client with the provided `options`. The available
 * options are:
 *
 *  - `routes`: An Object mapping arbitrary route names to descriptions of
 *    those routes. These descriptions should contain:
 *    - `path`: The absolute path to resolve to this route. If `path` contains
 *      `:var`-style parameters, those parameters will be provided to the
 *      instantiated React component as `params`. Required.
 *    - `component`: A React component class to be instantiated and rendered
 *      when this route is hit.
 *    - `method`: An optional filter based on HTTP method. _Only used for
 *      server-side routing._
 *    - `props`: An optional Object of static information to provide to the
 *      instantiated React component.
 */
function Router(options) {
  if (!(this instanceof Router)) {
    return new Router(options);
  }

  this.routes = Router.buildRouteTable(options && options.routes);

  if (!this.routes) {
    throw new Error('Missing a valid routes table.');
  }

  BaseRouter.call(this, this.routes);
}

/**
 * Builds a `routr`-compatible route table from the specified `routes`.
 */
Router.buildRouteTable = function buildRouteTable(routes) {
  if (!routes) {
    return null;
  }

  var names = Object.keys(routes);
  var defaults = routes.defaults || {};
  var table = {};

  names.forEach(function (name) {
    if (name === 'defaults') {
      return;
    }

    var config = routes[name];

    config = {
      path: config.path || defaults.path,
      component: config.component || defaults.component,
      method: config.method || defaults.method,
      props: config.props || defaults.props
    };

    if (typeof config.component !== 'function') {
      throw new Error('No component defined for "' + name + '" route.');
    }

    table[name] = config;
  });

  return table;
};

/**
 * Returns true if and only if the two `location`s passed in are on the
 * same domain.
 */
Router.prototype.isSameDomain = function isSameDomain(one, two) {
  one = url.parse(String(one));
  two = url.parse(String(two));

  return one.host && one.host === two.host;
};

/**
 * Returns a relative path to use for navigation based on the passed-in
 * `location`, a String href or Location object.
 */
Router.prototype.getPath = function getPath(location) {
  return url.parse(String(location)).pathname;
};

/**
 * Returns a route Object based on the passed-in `location`, a String href
 * or Location object.
 *
 * If `options` is passed in, it is used to further filter what routes are
 * tried.
 */
Router.prototype.getRoute = function getRoute(location, options) {
  var pathname = this.getPath(location);
  var route = BaseRouter.prototype.getRoute.call(this, pathname, options);

  return route;
};

/**
 * Returns the top-level React Component configured for the route, based on
 * the passed-in `location`, a String href or Location object.
 *
 * If `options` is passed in, it is used to further filter what routes are
 * tried.
 */
Router.prototype.getComponent = function getComponent(location, options) {
  var route = this.getRoute(location, options);
  var component = route.config.component;

  // No component is currently an unrecoverable state.
  // TODO(schoon) - Provide a fallback React component class?
  if (!component) {
    throw new Error('No component defined for "' + route.name + '" route.');
  }

  return component({
    path: this.getPath(location),
    route: route
  });
};

/*!
 * Export `Router`.
 */
module.exports = Router;
