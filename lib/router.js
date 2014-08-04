/*!
 * Router.js is reponsible for loading and consistently rendering React
 * components based on a JSON route configuration file.
 */
var url = require('url');
var util = require('util');
var BaseRouter = require('routr');
var App = require('./components/app.jsx');
var config = require('./config');

/**
 * Creates a new instance of router with the passed in Object. If no Object
 * is specified, it loads one from `./routes.json`.
 */
function Router(routes) {
  if (!(this instanceof Router)) {
    return new Router(routes);
  }

  if (!routes) {
    routes = require('./routes.json');
  }

  BaseRouter.call(this, routes);
}
util.inherits(Router, BaseRouter);

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

  return App({
    path: this.getPath(location),
    route: route,
    config: config
  });
};

/*!
 * Export `Router`.
 */
module.exports = Router;
