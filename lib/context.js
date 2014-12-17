/**
 * Contexts wrap the entire Littlest architecture through a single entry point.
 * This solves a few challenges at once:
 *
 * - Debugging is made easier because all internal traffic can be viewed in
 *   one place.
 * - De- and Rehydration of state can be accomplished at once.
 * - Both behaviour and state can be made individual by layering individual
 *   concerns on an existing Context, creating a new Context.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dispatcher = require('littlest-dispatcher');
var when = require('when');
var Router = require('./router');

/**
 * Creates a new instance of Context with the provided `options`.
 *
 * @param {Object} options
 */
function Context(options) {
  if (!(this instanceof Context)) {
    return new Context(options);
  }

  EventEmitter.call(this);

  options = options || {};

  this.logger = this.logger || options.logger || null;
  this.router = this.router || options.router || new Router();

  this.dispatcher = dispatcher.createDispatcher({ logger: this.logger });
  this.actions = {};
  this.stores = {};

  this._cloneSteps = options._cloneSteps || [];
}
util.inherits(Context, EventEmitter);
Context.createContext = Context;

/**
 * Creates and returns a new Context inheriting all Actions and Stores from
 * this parent Context. Requests and state updates made within the child
 * Context will be confined to the child, adn lost whenever the child is
 * destroyed.
 *
 * If provided, `options` will override any options this Context would
 * otherwise have provided (or not) to the child.
 */
Context.prototype.getChild = function getChild(options) {
  var opts = {};

  util._extend(opts, this);
  util._extend(opts, options);

  var context = new Context(opts);

  context._cloneFrom(this);

  return context;
};

/**
 * Creates a new, named Action associated with this Context. Modules may
 * perform the Action through this Context, and the Context will be made
 * available as `this` within the function body.
 *
 * Returns the Context for cascading.
 */
Context.prototype.createAction = function createAction(name, fn) {
  function step(parent) {
    this.actions[name] = this.dispatcher.createAction(name, fn);
    return this.actions[name];
  }

  return this._addAndRunStep(step);
};

/**
 * Performs the named Action, passing in `params` as the first and only
 * argument to the originally-defined function.
 */
Context.prototype.performAction = function performAction(name, params) {
  var fn = this.actions[name];

  if (!fn) {
    return when.reject(new Error('Could not find action \'' + name + '\''));
  }

  return fn.call(this, params);
};

/**
 * Creates a new, named Store associated with this Context. Modules may access
 * the Store through this Context, and the Store can subscribe to updates
 * through the Context's shared Dispatcher.
 *
 * Returns the Context for cascading.
 */
Context.prototype.createStore = function createStore(name, props) {
  function step(parent) {
    var ctx = this;

    ctx.stores[name] = ctx.dispatcher.createStore(parent && parent.stores[name].toObject() || props);

    // TODO(schoon) - Find a better way to persist event handlers to child
    // Contexts.
    ctx.stores[name].handle = function handle(eventName, fn) {
      return ctx._addAndRunStep(function () {
        return dispatcher.Store.prototype.handle.call(this.stores[name], eventName, fn);
      });
    };

    return ctx.stores[name];
  }

  return this._addAndRunStep(step);
};

/**
 * Gets the named Store.
 */
Context.prototype.getStore = function getStore(name) {
  return this.stores[name];
};

/**
 * Adds a named route to the Router. See `Router.addRoute` for more details.
 *
 * Returns the Context for cascading.
 */
Context.prototype.createRoute = function createRoute(name, config) {
  this.router.addRoute(name, config);

  return this;
};

/**
 * Adds a status-specific route to the Router. See `Router.addErrorRoute` for
 * more details.
 *
 * Returns the Context for cascading.
 */
Context.prototype.createErrorRoute = function createErrorRoute(status, config) {
  this.router.addErrorRoute(status, config);

  return this;
};

/**
 * Returns a valid URL for the `name` route. Any `params` are used to build
 * the URL, eventually available through `props.route.params`.
 */
Context.prototype.getRouteUrl = function getRouteUrl(name, params) {
  return this.router.getRouteUrl(name, params);
};

/**
 * Navigates to the `name` Route. Any `params` are used internally to build
 * the target URL, eventually available through `props.route.params`.
 */
Context.prototype.navigateToRoute = function navigateToRoute(name, params) {
  // TODO(schoon) - Find a way to do this without seemingly-magical events.
  return this.emit('navigate', {
    location: this.getRouteUrl(name, params)
  });
};

/**
 * Serializes the Context and all associated Stores as JSON.
 */
Context.prototype.toJSON = function toJSON() {
  return {
    stores: this.stores
  };
};

/**
 * Deserializes the passed-in Object into the Context and its associated Stores.
 */
Context.prototype.fromObject = function fromObject(obj) {
  var self = this;

  if (!obj || !obj.stores) {
    return;
  }

  Object.keys(self.stores)
    .forEach(function (key) {
      self.stores[key].fromObject(obj.stores[key]);
    });
};

/**
 * Internal helper to add `step` functions to run when setting up a child
 * Context.
 */
Context.prototype._addAndRunStep = function _addAndRunStep(step) {
  this._cloneSteps.push(step);
  return step.call(this);
};

/**
 * Internal helper to set up a child Context from the steps in the parent.
 */
Context.prototype._cloneFrom = function _cloneFrom(parent) {
  var self = this;

  self._cloneSteps.forEach(function (step) {
    step.call(self, parent);
  });

  return self;
};

/*!
 * Export `Context`.
 */
module.exports = Context;
