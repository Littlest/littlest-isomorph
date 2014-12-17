/**
 * The StaticRenderer (as its name suggests) is responsible for server-side
 * rendering: rendering to a String that can be sent over-the-wire to clients.
 */
var fs = require('fs');
var React = require('react');
var Container = require('../container');

/**
 * Creates a new instance of StaticRenderer with the provided `options`.
 * The available options are:
 *
 *  - `template`: If provided, this template is wrapped around the top-level
 *    React component. Either `template` or `templatePath` is required.
 *  - `templatePath`: If provided and `template` is omitted, the template will
 *    be loaded from this absolute path. Either `template` or `templatePath` is
 *    required.
 */
function StaticRenderer(options) {
  if (!(this instanceof StaticRenderer)) {
    return new StaticRenderer(options);
  }

  options = options || {};

  this.template = options.template || null;

  if (!this.template && options.templatePath) {
    this.template = fs.readFileSync(options.templatePath, 'utf8');
  }

  if (!this.template) {
    throw new Error('Missing either a template or a templatePath.');
  }

  if (this.template.indexOf('{body}') === -1) {
    throw new Error('Template does not contain a {body} render target.');
  }

  this._renderHead = this.template.indexOf('{head}') !== -1;
}
StaticRenderer.createRenderer = StaticRenderer;

/**
 * Renders the provided route as valid HTML, returning the HTML as a String.
 */
StaticRenderer.prototype.render = function render(route, context) {
  var html = this.template;
  var body;
  var head;

  body = React.renderToString(React.createElement(Container, {
    route: route,
    context: context
  }));

  body += '<script>window.LITTLEST_ISOMORPH_CONTEXT = ' + JSON.stringify(context || {}) + ';</script>';

  if (this._renderHead) {
    head = React.renderToStaticMarkup(route.head);
    html = html.replace('{head}', head);
  }

  return html.replace('{body}', body);
};

/*!
 * Export `StaticRenderer`.
 */
module.exports = StaticRenderer;
