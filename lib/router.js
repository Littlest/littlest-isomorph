var url = require('url');
var util = require('util');
var BaseRouter = require('routr');

var App = require('./components/app.jsx');

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

Router.prototype.getRoute = function getRoute(location, options) {
  var pathname = url.parse(location).pathname;
  var route = BaseRouter.prototype.getRoute.call(this, pathname, options);

  return route;
};

Router.prototype.getComponent = function getComponent(location, options) {
  var route = this.getRoute(location, options);

  if (!route) {
    return null;
  }

  return App(util._extend(
    { path: url.parse(location).pathname },
    route.config.props
  ));
};

/*!
 * Export `Router`.
 */
module.exports = Router;
