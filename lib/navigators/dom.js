/**
 * The DomNavigator is responsible for navigation between components, both via
 * a top-level DOM `click` event handler and on-request.
 */
var when = require('when');
var Context = require('../context');
var DomRenderer = require('../renderers/dom');

/**
 * Creates a new instance of DomNavigator with the provided `options`.
 *
 *  - `renderer`: A valid Renderer instance. Defaults to DomRenderer.
 *  - `context`: A valid Context instance. If provided, this Context will be
 *      rehydrated with any state provided from upstream Renderers provided a
 *      similar Context. Recommended.
 */
function DomNavigator(options) {
  if (!(this instanceof DomNavigator)) {
    return new DomNavigator(options);
  }

  options = options || {};

  this.renderer = this.renderer || options.renderer || new DomRenderer(options);
  this.context = this.context || options.context || new Context(options);

  if (!this.renderer) {
    throw new Error('Missing a valid renderer.');
  }
}
DomNavigator.createNavigator = DomNavigator;

/**
 * Navigates to the given `location`, represented as either a String href or
 * Location object.
 *
 * Available options:
 * - `performAction` - If true, perform the Action configured for this route.
 * - `pushState` - If true, push the new head state onto the History API.
 */
DomNavigator.prototype.navigate = function navigate(location, options) {
  var self = this;

  options = options || {};

  // TODO(schoon) - Does `isSameDomain` only matter for DomNavigator? At the
  // least, it's a Navigator thing, so it can be pulled from Router to here.
  if (!self.context.router.isSameDomain(location, global.location)) {
    return;
  }

  // TODO(schoon) - Explore moving some of this logic to Context to avoid
  // reaching into it for routing information.
  var route = self.context.router.getRoute(location);
  var promise;

  if (!route) {
    route = self.context.router.getErrorRoute(404);
  }

  if (!route) {
    throw new Error('No route found, and no 404 page provided.');
  }

  if (!route.body) {
    throw new Error('No body component found.');
  }

  if (options.performAction && route.action && self.context) {
    promise = self.context.performAction(route.action, route.params);
  }

  return when(promise)
    .then(function () {
      var props = {
        route: route,
        context: self.context
      };

      self.renderer.render(route, self.context);

      global.document.title = self.getTitle(props) || global.document.title;

      if (options.pushState) {
        global.history.pushState(null, '', location);
      }
    });
};

/**
 * Handles anchor navigation as a result of `event` ClickEvent by triggering
 * a re-render. All other `click` events pass through, unharmed.
 */
DomNavigator.prototype.onClick = function onClick(event) {
  var self = this;

  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  function search(element) {
    if (!element) {
      return;
    }

    if (element.href) {
      return navigate(element.href);
    }

    search(element.parentElement);
  }

  function navigate(location) {
    event.preventDefault();

    self.navigate(location, {
      performAction: true,
      pushState: true
    });
  }

  search(event.target);
};

/**
 * Calculates the expected title based on the `props`. The included route's
 * `title` property, either a String or a Function, is used for the calculation.
 * If a Function, the `props` themselves are passed in.
 */
DomNavigator.prototype.getTitle = function getTitle(props) {
  var title = props.route.title;

  if (typeof title === 'function') {
    title = title(props);
  }

  return String(title);
};

/**
 * Installs the necessary event handlers in the browser.
 *
 * Available options:
 * - `performAction` - Force the navigator to perform the initial Action.
 */
DomNavigator.prototype.start = function start(options) {
  var self = this;

  options = options || {};

  // Rehydrate the Context first and once.
  if (self.context) {
    self.context.fromObject(global.LITTLEST_ISOMORPH_CONTEXT);
  }

  // When the Back button is pressed, we need to rehydrate based on state
  // stored by the browser-stored.
  global.onpopstate = function () {
    self.navigate(global.location, {
      performAction: true
    });
  };

  // When the DOM initially loads, we need to rehydrate based on state provided
  // by the server.
  global.document.addEventListener('DOMContentLoaded', function () {
    self.navigate(global.location, {
      performAction: !global.LITTLEST_ISOMORPH_CONTEXT || options.performAction
    });
  });

  // Navigation is done through a top-level click handler, so attach that.
  global.document.addEventListener('click', function onClick(event) {
    self.onClick(event);
  });

  self.context.on('navigate', function (params) {
    self.navigate(params.location, {
      performAction: true,
      pushState: true
    });
  });
};

/*!
 * Export `DomNavigator`.
 */
module.exports = DomNavigator;
