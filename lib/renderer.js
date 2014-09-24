/*!
 * Renderer.js is responsible for the server-side render pipeline. This
 * capability is exposed through Mach-style middleware.
 */
var fs = require('fs');
var util = require('util');
var when = require('when');

/**
 * Creates a new instance of the Renderer middleware with the specified
 * `options`. The available options are:
 *
 *  - `template`: If provided, this template is wrapped around the top-level
 *    React component. Either `template` or `templatePath` is required.
 *  - `templatePath`: If provided and `template` is omitted, the template will
 *    be loaded from this absolute path. Either `template` or `templatePath` is
 *    required.
 *  - `router`: A valid Router instance. Required.
 *  - `React`: The React library to use. Since React store state internal to
 *      the module instance, sharing the module _itself_ is an invariant.
 *      Though providing this module is recommended, the Client will attempt
 *      to `require` it if not provided.
 *  - `context`: A valid Context instance. If provided, this Context will be
 *      serialized in a way that a similar Context provided to a downstream
 *      Client will be rehydrated with the same state. Recommended.
 */
function Renderer(options) {
  if (!(this instanceof Renderer)) {
    return new Renderer(options);
  }

  options = options || {};

  this.template = options.template || null;
  this.router = options.router || null;
  this.React = options.React || require('react');
  this.context = options.context || null;

  if (!this.template && options.templatePath) {
    this.template = fs.readFileSync(options.templatePath, 'utf8');
  }

  if (!this.template) {
    throw new Error('Missing either a template or a templatePath.');
  }

  this.template = this.template.replace(/(id="app">)[\s]*(<\/)/, '$1%s$2');

  if (this.template.indexOf('%s') === -1) {
    throw new Error('Template does not contain a %%s render target.');
  }

  if (!this.router) {
    throw new Error('Missing a valid router.');
  }
}
Renderer.createRenderer = Renderer;

/**
 * Renders the provided React component as valid HTML.
 */
Renderer.prototype.render = function render(component, context) {
  var html = this.React.renderComponentToString(component);

  html += '<script>window.LITTLEST_ISOMORPH_CONTEXT = ' + JSON.stringify(context || {}) + ';</script>';

  return util.format(this.template, html);
};

/**
 * Renders the provided Route, sending the finished HTML to `response`. If
 * provided, `context` will be used to perform the Route's Action and for
 * dehydrating state.
 *
 * Returns a promise to be fulfilled once writing to the Response is complete
 * or rejected with the first Error.
 */
Renderer.prototype.serveRoute = function serveRoute(route, response, context) {
  var self = this;
  var promise = null;

  if (route.action && context) {
    promise = context.performAction(route.action, route.params);
  }

  return when(promise)
    .then(function () {
      return route.component({
        route: route,
        context: context
      });
    })
    .then(function (component) {
      return self.render(component, context);
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
Renderer.prototype.errorHandler = function errorHandler() {
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

    if (!route.component) {
      return next(new Error('No component found.'));
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
Renderer.prototype.childContextHandler = function childContextHandler() {
  var self = this;

  function middleware(request, response, next) {
    request.context = self.context.getChild();

    next();
  }

  return middleware;
};

/**
 * Returns middleware to render the React component configured for the
 * requested route. This should be at the _top_ of the middleware stack.
 */
Renderer.prototype.requestHandler = function requestHandler() {
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

    if (!route.component) {
      return next(new Error('No component found.'));
    }

    self.serveRoute(route, response, request.context || self.context)
      .then(null, next)
      .done();
  }

  return middleware;
};

/*!
 * Export `Renderer`.
 */
module.exports = Renderer;
