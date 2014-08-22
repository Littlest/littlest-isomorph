/*!
 * Renderer.js is responsible for the server-side render pipeline. This
 * capability is exposed through Connect-style middleware.
 */
var fs = require('fs');
var util = require('util');
var ReactWhen = require('react-when');

/**
 * Creates a new instance of the Renderer middleware mounted on `app` with
 * the specified `options`. The available options are:
 *
 *  - `template` - If provided, this template is wrapped around the top-level
 *    React component. Either `template` or `templatePath` is required.
 *  - `templatePath` - If provided and `template` is omitted, the template will
 *    be loaded from this absolute path. Either `template` or `templatePath` is
 *    required.
 *  - `router` - A valid Router instance. Required.
 */
function Renderer(app, options) {
  if (!(this instanceof Renderer)) {
    return new Renderer(app, options);
  }

  options = options || {};

  this.app = app || null;
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

/**
 * Internal method `mach`-compatible middleware stacks use to run the
 * middleware. Should return a response, optionally calling the next layer
 * down.
 */
Renderer.prototype.call = function call(request) {
  var self = this;
  var component = self.router.getComponent(request.url, { method: request.method });

  return ReactWhen.renderComponentToStringAsync(component)
    .then(function (html) {
      return util.format(self.template, html);
    })
    .then(function (html) {
      return {
        status: component._store.props.route ? 200 : 404,
        headers: {
          'Content-Type': 'text/html'
        },
        content: html
      };
    });
};

/*!
 * Export `Renderer`.
 */
module.exports = Renderer;
