/**
 * The ExpressNavigator is (as its name suggests) responsible for navigation
 * between components via Express-compatible middleware.
 */
var when = require('when');
var whenKeys = require('when/keys');
var StaticRenderer = require('../renderers/static');

/**
 * Creates a new instance of ExpressNavigator with the provided `options`.
 * The available options are:
 *
 *  - `router`: A valid Router instance. Required.
 *  - `context`: A valid Context instance. If provided, this Context will be
 *      serialized in a way that a similar Context provided to a downstream
 *      Client will be rehydrated with the same state. Recommended.
 */
function ExpressNavigator(options) {
  if (!(this instanceof ExpressNavigator)) {
    return new ExpressNavigator(options);
  }

  options = options || {};

  this.renderer = this.renderer || options.renderer || new StaticRenderer(options);
  this.router = options.router || null;
  this.context = options.context || null;

  if (!this.renderer) {
    throw new Error('Missing a valid renderer.');
  }

  if (!this.router) {
    throw new Error('Missing a valid router.');
  }
}
ExpressNavigator.createNavigator = ExpressNavigator;

/**
 * Renders the provided Route, sending the finished HTML to `response`. If
 * provided, `context` will be used to perform the Route's Action and for
 * dehydrating state.
 *
 * Returns a promise to be fulfilled once writing to the Response is complete
 * or rejected with the first Error.
 */
ExpressNavigator.prototype.serveRoute = function serveRoute(route, response, context) {
  var self = this;
  var promise = null;

  if (route.action && context) {
    promise = context.performAction(route.action, route.params);
  }

  return when(promise)
    .then(function () {
      var props = {
        route: route,
        context: context
      };

      return whenKeys.all({
        head: route.head && route.head(props),
        body: route.body && route.body(props)
      });
    })
    .then(function (components) {
      return self.renderer.render(components, context);
    })
    .then(function (html) {
      response
        .status(route.status)
        .set('Content-Type', 'text/html')
        .send(html);
    });
};

/**
 * Returns middleware to render the React component configured to handle 500
 * errors should an error exist further up the middleware stack. This should
 * be at the _bottom_ of the middleware stack.
 */
ExpressNavigator.prototype.errorHandler = function errorHandler() {
  var self = this;

  function middleware(err, request, response, next) {
    if (err.status) {
      err = { message: 'Failed request: ' + err.entity.message };
    }

    console.error(err.stack || err.message || err);

    var route = self.router.getErrorRoute(500, err.message);

    if (!route) {
      return next(new Error('No 500 page provided.'));
    }

    if (!route.body) {
      return next(new Error('No body component found.'));
    }

    self.serveRoute(route, response)
      .then(null, next)
      .done();
  }

  return middleware;
};

/**
 * Returns middleware that isolates a child Context for each Request. This
 * should be in the _middle_ of the middleware stack.
 */
ExpressNavigator.prototype.childContextHandler = function childContextHandler() {
  var self = this;

  function middleware(request, response, next) {
    // TODO(schoon) - Should the context _always_ be added as `req.context`,
    // even if it's top-level? That would allow this middleware to be
    // completely static, and access to the Context would be consistent.
    request.context = self.context.getChild();

    next();
  }

  return middleware;
};

/**
 * Returns middleware to render the React component configured for the
 * requested route. This should be at the _top_ of the middleware stack.
 */
ExpressNavigator.prototype.requestHandler = function requestHandler() {
  var self = this;

  function middleware(request, response, next) {
    if (request.method.toLowerCase() !== 'get') {
      return next();
    }

    var route = self.router.getRoute(request.url);

    if (!route) {
      route = self.router.getErrorRoute(404);
    }

    if (!route) {
      return next(new Error('No route found, and no 404 page provided.'));
    }

    if (!route.body) {
      return next(new Error('No body component found.'));
    }

    self.serveRoute(route, response, request.context || self.context)
      .then(null, next)
      .done();
  }

  return middleware;
};

/*!
 * Export `ExpressNavigator`.
 */
module.exports = ExpressNavigator;
