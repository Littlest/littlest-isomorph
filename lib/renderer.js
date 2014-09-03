/*!
 * Renderer.js is responsible for the server-side render pipeline. This
 * capability is exposed through Mach-style middleware.
 */
var fs = require('fs');
var util = require('util');
var ReactWhen = require('react-when');
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
 */
function Renderer(options) {
  if (!(this instanceof Renderer)) {
    return new Renderer(options);
  }

  options = options || {};

  this.template = options.template || null;
  this.router = options.router || null;

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
      return ReactWhen.renderComponentToStringAsync(component)
        .then(function (html) {
          return util.format(self.template, html);
        })
        .then(function (html) {
          var status = component._store.props.status;
          return {
            status: status || 200,
            headers: {
              'Content-Type': 'text/html'
            },
            content: html
          };
        });
    });
};

/**
 * Mounts middleware to render the React component configured to handle 500
 * errors should an error exist further up the middleware stack. This should
 * be at the _bottom_ of the middleware stack.
 */
Renderer.prototype.mountErrorHandler = function mountErrorHandler(app) {
  var self = this;

  app.use(function (app) {
    return function (request) {
      return request.call(app)
        .then(null, function (err) {
          if (err.status) {
            err = { message: 'Failed request: ' + err.entity.message };
          }

          console.error(err.stack || err.message || err);
          return self.render(self.router.getErrorComponent(500, err.message));
        });
    };
  });

  return self;
};

/**
 * Mounts middleware to render the React component configured for the
 * requested route. This should be at the _top_ of the middleware stack.
 */
Renderer.prototype.mountRequestHandler = function mountRequestHandler(app) {
  var self = this;

  app.use(function (app) {
    return function (request) {
      if (request.method.toLowerCase() !== 'get') {
        return request.call(app);
      }

      var component = self.router.getComponent(request.url, { method: request.method });

      return self.render(component);
    };
  });

  return self;
};

/*!
 * Export `Renderer`.
 */
module.exports = Renderer;
