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

      document.title = self.getTitle(props) || document.title;
    });
};

/**
 * Handles anchor navigation as a result of `event` ClickEvent by triggering
 * a re-render. All other `click` events pass through, unharmed.
 */
Client.prototype.onClick = function onClick(event) {
  var self = this;

  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  function search(element) {
    if (!element) {
      return;
    }

    if (element.href) {
      navigate(element.href);
    } else {
      search(element.parentElement);
    }
  }

  function navigate(href) {
    if (!self.router.isSameDomain(href, self.window.location)) {
      return;
    }

    event.preventDefault();
    self.renderApplication(href, true);
    self.window.history.pushState(null, '', href);
  }

  search(event.target);
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
    self.context.fromObject(self.window.LITTLEST_ISOMORPH_CONTEXT);
  }

  // Rehydrate should be called in two situations: both with the Back button is
  // pressed to rehydrate based on browser-stored state, and once content
  // initially loads based on server-provided state.
  self.window.onpopstate = rehydrate;
  self.window.document.addEventListener('DOMContentLoaded', rehydrate);

  // Navigation is done through a master click handler, so attach that.
  self.window.document.addEventListener('click', function onClick(event) {
    return self.onClick(event);
  });
};

/*!
 * Export `Client`.
 */
module.exports = Client;
