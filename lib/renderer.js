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
 *  - `template` - If provided, this template is wrapped around the top-level
 *    React component. Either `template` or `templatePath` is required.
 *  - `templatePath` - If provided and `template` is omitted, the template will
 *    be loaded from this absolute path. Either `template` or `templatePath` is
 *    required.
 *  - `router` - A valid Router instance. Required.
 *  - `React`: The React library to use. Since React store state internal to
 *      the module instance, sharing the module _itself_ is an invariant.
 *      Though providing this module is recommended, the Client will attempt
 *      to `require` it if not provided.
 */
function Renderer(options) {
  if (!(this instanceof Renderer)) {
    return new Renderer(options);
  }

  options = options || {};

  this.template = options.template || null;
  this.router = options.router || null;
  this.React = options.React || require('react');

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
 * Renders the provided React component (or Promise thereof) as a valid HTTP
 * Response.
 */
Renderer.prototype.render = function render(componentOrPromise) {
  var self = this;

  return when(componentOrPromise)
    .then(function (component) {
      var html = self.React.renderComponentToString(component);
      var status = component.props.status;

      html = util.format(self.template, html);

      return {
        status: status || 200,
        headers: {
          'Content-Type': 'text/html'
        },
        content: html
      };
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

    self.render(self.router.getErrorComponent(500, err.message))
      .then(function (data) {
        response
          .status(data.status)
          .set(data.headers)
          .send(data.content);
      })
      .then(null, next);
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

    var component = self.router.getComponent(request.url, { method: request.method });

    self.render(component)
      .then(function (data) {
        response
          .status(data.status)
          .set(data.headers)
          .send(data.content);
      })
      .then(null, next);
  }

  return middleware;
};

/*!
 * Export `Renderer`.
 */
module.exports = Renderer;
