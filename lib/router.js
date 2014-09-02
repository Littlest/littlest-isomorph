/*!
 * Router.js is reponsible for loading and consistently rendering React
 * components based on a JSON route configuration file.
 */
var url = require('url');
var BaseRouter = require('routr');
var ERROR_NAMES = {
  '400': 'BadRequest',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'NotFound',
  '409': 'Conflict',
  '410': 'Gone',
  '418': 'ImATeapot',
  '429': 'TooManyRequests',
  '500': 'InternalServerError',
  '501': 'NotImplemented',
  '502': 'BadGateway',
  '503': 'ServiceUnavailable',
  '504': 'GatewayTimeout'
};

/**
 * Creates a new instance of Router with the provided `options`. The available
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

  options = options || {};

  this.routes = options.routes || {};
  this.defaults = options.defaults || {};
  this.errors = options.errors || {};

  this._router = new BaseRouter(this._getRoutrTable());
}
Router.createRouter = Router;

/**
 * Builds a `routr`-compatible route table from the Router's configuration.
 */
Router.prototype._getRoutrTable = function _getRoutrTable() {
  var self = this;
  var names = Object.keys(self.routes);
  var table = {};

  names.forEach(function (name) {
    var config = self.routes[name];

    config = {
      path: config.path || self.defaults.path,
      component: config.component || self.defaults.component,
      method: 'get',
      props: config.props || self.defaults.props
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
 */
Router.prototype.getRoute = function getRoute(location) {
  var pathname = this.getPath(location);
  var route = this._router.getRoute(pathname);

  return route;
};

/**
 * Returns the top-level React Component configured for the route, based on
 * the passed-in `location`, a String href or Location object.
 */
Router.prototype.getComponent = function getComponent(location) {
  var route = this.getRoute(location);
  var component = route && route.config.component;

  if (!route) {
    return this.getErrorComponent(404);
  }

  return component({
    status: 200,
    error: null,
    route: route
  });
};

/**
 * Returns the component associated with the `errorCode` HTTP code.
 */
Router.prototype.getErrorComponent = function getErrorComponent(errorCode, message) {
  var route = this.errors[errorCode] || this.errors[ERROR_NAMES[errorCode]];
  var component = route && route.component;

  // No component is currently an unrecoverable state.
  // TODO(schoon) - Provide a fallback React component class?
  if (!component) {
    throw new Error('No component found.');
  }

  return component({
    status: errorCode,
    error: message || ERROR_NAMES[errorCode],
    route: null
  });
};

/*!
 * Export `Router`.
 */
module.exports = Router;
