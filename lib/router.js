/*!
 * Router.js is reponsible for loading and consistently rendering React
 * components based on a JSON route configuration file.
 */
var url = require('url');
var BaseRouter = require('routr');
var when = require('when');
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
 *      instantiated React components as `params`. Required.
 *    - `head`: An optional React component class to be instantiated and
 *      rendered into {head} when this route is hit.
 *    - `body`: A React component class to be instantiated and rendered into
 *      {body} when this route is hit.
 *    - `props`: An optional Object of static information to provide to the
 *      instantiated React components.
 *    - `action`: An optional String name of an Action to perform before
 *      instantiating and React components. The Action may return a Promise if
 *      it depends on asynchronous behaviour to complete.
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
      method: 'get',
      path: config.path || self.defaults.path,
      head: config.head || self.defaults.head,
      body: config.body || self.defaults.body,
      props: config.props || self.defaults.props,
      action: config.action || self.defaults.action,
      title: config.title || self.defaults.title
    };

    if (typeof config.body !== 'function') {
      throw new Error('No body component defined for "' + name + '" route.');
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
 * Returns a Route object based on the passed-in `location`, a String href
 * or Location object.
 */
Router.prototype.getRoute = function getRoute(location) {
  var pathname = this.getPath(location);
  var route = this._router.getRoute(pathname);

  return this._mapRoutrRoute(route);
};

/**
 * Returns a Route object for the given `errorCode` HTTP status code.
 */
Router.prototype.getErrorRoute = function getErrorRoute(errorCode, message) {
  var route = this.errors[errorCode] || this.errors[ERROR_NAMES[errorCode]];

  return this._mapRoutrRoute(route, {
    status: errorCode,
    error: message || ERROR_NAMES[errorCode]
  });
};

/**
 * Internal use only.
 *
 * Maps a Routr-provided route object to a Route as expected by Router
 * consumers.
 */
Router.prototype._mapRoutrRoute = function _mapRoutrRoute(route, options) {
  if (!route) {
    return null;
  }

  options = options || {};

  return {
    status: options.status || 200,
    error: options.error || null,
    name: route.name,
    params: route.params,
    action: route.action || route.config && route.config.action,
    head: route.head || route.config && route.config.head,
    body: route.body || route.config && route.config.body,
    props: route.props || route.config && route.config.props,
    title: route.title || route.config && route.config.title
  };
};

/*!
 * Export `Router`.
 */
module.exports = Router;
