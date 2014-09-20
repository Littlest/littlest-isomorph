/*!
 * Client.js contains all client-specific code, run immediately only in the
 * browser.
 *
 * Our browser-specific concerns are:
 * - Browser-side routing and navigation.
 * - Browser history preservation and restoration.
 * - Intercepting anchor navigation.
 * - Rehydrating any state received by the server.
 */
var when = require('when');

/**
 * Creates a new instance of Client with the provided `options`. The available
 * options are:
 *
 *  - `router`: A valid Router instance. Required.
 *  - `window`: The top-level `window` object. Required.
 *  - `React`: The React library to use. Since React store state internal to
 *      the module instance, sharing the module _itself_ is an invariant.
 *      Though providing this module is recommended, the Client will attempt
 *      to `require` it if not provided.
 */
function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }

  options = options || {};

  this.router = options.router || null;
  this.window = options.window || (typeof window === 'undefined' ? null : window);
  this.React = options.React || require('react');

  if (!this.router) {
    throw new Error('Missing a valid router.');
  }

  this.onClick = this.onClick.bind(this);
}
Client.createClient = Client;

/**
 * Renders the top-level React Component, the Application, based on the current
 * Router configuration and the passed in `location`.
 *
 * See `Router.getComponent` for more information.
 */
Client.prototype.renderApplication = function renderApplication(location) {
  var self = this;

  self.window.history.pushState(null, '', String(location));

  when(self.router.getComponent(location))
    .then(function (component) {
      self.React.renderComponent(component, document.getElementById('app'));
      self.registerOnClick();
    });
};

/**
 * Registers all necessary onclick handlers for proper navigation.
 */
Client.prototype.registerOnClick = function registerOnClick() {
  for (var idx = this.window.document.links.length; idx--;) {
    this.window.document.links[idx].onclick = this.onClick;
  }
};

/**
 * Handles anchor navigation by triggering a re-render.
 *
 * NOTE: Instances of Client get their own, bound version of `onClick` during
 * construction.
 */
Client.prototype.onClick = function onClick(event) {
  if (event.ctrlKey || !this.router.isSameDomain(event.target.href, this.window.location)) {
    return true;
  }

  this.renderApplication(event.target.href);
  return false;
};

/**
 * Installs the necessary event handlers in the browser.
 */
Client.prototype.start = function start() {
  var self = this;

  /**
   * Rehydrates the application based on the current state.
   */
  function rehydrate() {
    self.renderApplication(self.window.location);
  }

  // Rehydrate should be called in two situations: both with the Back button is
  // pressed to rehydrate based on browser-stored state, and once content
  // initially loads based on server-provided state.
  this.window.onpopstate = rehydrate;
  this.window.document.addEventListener('DOMContentLoaded', rehydrate);
};

/*!
 * Export `Client`.
 */
module.exports = Client;
