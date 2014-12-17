/**
 * The DomRenderer is responsible for client-side rendering:rendering to a DOM
 * Node, presumably parsed from statically-rendered HTML.
 */
var React = require('react');
var Container = require('../container');

/**
 * Creates a new instance of DomRenderer with the provided `options`.
 *
 * @param {Object} options
 */
function DomRenderer(options) {
  if (!(this instanceof DomRenderer)) {
    return new DomRenderer(options);
  }

  options = options || {};

  this.root = this.root || options.root || global.document.body;
}
DomRenderer.createRenderer = DomRenderer;

/**
 * Renders the provided Route within the configured root DOM Element.
 */
DomRenderer.prototype.render = function render(route, context) {
  React.render(
    React.createElement(Container, {
      route: route,
      context: context
    }),
    this.root
  );
};

/*!
 * Export `DomRenderer`.
 */
module.exports = DomRenderer;
