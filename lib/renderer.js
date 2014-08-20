/*!
 * Renderer.js is responsible for the server-side render pipeline. This
 * capability is exposed through Connect-style middleware.
 */
var fs = require('fs');
var util = require('util');
var ReactWhen = require('react-when');

/**
 * Generates the renderer middleware with the supplied `options`. The available
 * options are:
 *
 *  - `template` - If provided, this template is wrapped around the top-level
 *    React component. Either `template` or `templatePath` is required.
 *  - `templatePath` - If provided and `template` is omitted, the template will
 *    be loaded from this absolute path. Either `template` or `templatePath` is
 *    required.
 *  - `router` - A valid Router instance. Required.
 */
function generateRenderer(options) {
  options = options || {};

  var template = options.template || null;
  var router = options.router || null;

  if (!template && options.templatePath) {
    template = fs.readFileSync(options.templatePath, 'utf8');
  }

  if (!template) {
    throw new Error('Missing either a template or a templatePath.');
  }

  template = template.replace(/(id="app">)[\s]*(<\/)/, '$1%s$2');

  if (template.indexOf('%s') === -1) {
    throw new Error('Template does not contain a %%s render target.');
  }

  if (!router) {
    throw new Error('Missing a valid router.');
  }

  function render(req, res, next) {
    var component = router.getComponent(req.url, { method: req.method });

    return ReactWhen.renderComponentToStringAsync(component)
      .then(function (html) {
        return util.format(template, html);
      })
      .then(function (html) {
        res.writeHeader(component._store.props.route ? 200 : 404, {
          'Content-Type': 'text/html'
        });
        res.end(html);
      }, next)
      .done();
  }

  return render;
}

/*!
 * Export `generateRenderer`.
 */
module.exports = generateRenderer;
