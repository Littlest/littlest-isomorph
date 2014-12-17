/**
 * The DomRenderer is responsible for client-side rendering:rendering to a DOM
 * Node, presumably parsed from statically-rendered HTML.
 */
var React = require('react');

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
}
DomRenderer.createRenderer = DomRenderer;

/**
 * Renders the provided React body component to the given DOM Element.
 */
DomRenderer.prototype.render = function render(body, element, context) {
  React.render(body, element);
};

/*!
 * Export `DomRenderer`.
 */
module.exports = DomRenderer;
