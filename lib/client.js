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
 *  - `context`: A valid Context instance. If provided, this Context will be
 *      rehydrated with any state provided from upstream Renderers provided a
 *      similar Context. Recommended.
 */
function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }

  options = options || {};

  this.router = options.router || null;
  this.window = options.window || (typeof window === 'undefined' ? null : window);
  this.React = options.React || require('react');
  this.context = options.context || null;

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
Client.prototype.renderApplication = function renderApplication(location, perform) {
  var self = this;
  var route = self.router.getRoute(location);
  var promise;

  self.window.history.pushState(null, '', String(location));

  if (!route) {
    route = self.router.getErrorRoute(404);
  }

  if (!route) {
    return next(new Error('No route found, and no 404 page provided.'));
  }

  if (!route.body) {
    return next(new Error('No body component found.'));
  }

  if (perform && route.action && self.context) {
    promise = self.context.performAction(route.action, route.params);
  }

  return when(promise)
    .then(function () {
      var props = {
        route: route,
        context: self.context
      };

      self.React.renderComponent(route.body(props), document.body);
      self.registerOnClick();

      document.title = self.getTitle(props) || document.title;
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

  this.renderApplication(event.target.href, true);
  return false;
};

/**
 * Calculates the expected title based on the `props`. The included route's
 * `title` property, either a String or a Function, is used for the calculation.
 * If a Function, the `props` themselves are passed in.
 */
Client.prototype.getTitle = function getTitle(props) {
  var title = props.route.title;

  if (typeof title === 'function') {
    title = title(props);
  }

  return String(title);
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
    self.renderApplication(self.window.location, !self.window.LITTLEST_ISOMORPH_CONTEXT);
  }

  // Rehydrate the Context first and once.
  if (self.context) {
    self.context.fromObject(this.window.LITTLEST_ISOMORPH_CONTEXT);
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
