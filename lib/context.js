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
var util = require('util');
var dispatcher = require('littlest-dispatcher');

/**
 * Creates a new instance of Context with the provided `options`.
 *
 * @param {Object} options
 */
function Context(options) {
  if (!(this instanceof Context)) {
    return new Context(options);
  }

  options = options || {};

  this.dispatcher = dispatcher.createDispatcher();
  this.actions = {};
  this.stores = {};

  this._cloneSteps = options._cloneSteps || [];
}

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

  var context = new Context(this);

  this._cloneSteps.forEach(function (step) {
    step.call(context);
  });

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
  return this.actions[name].call(this, params);
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
    this.stores[name] = this.dispatcher.createStore(parent && parent.stores[name].toObject() || props);
    return this.stores[name];
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
 * Serializes the Context and all associated Stores as JSON.
 */
Context.prototype.toJSON = function toJSON() {
  return {
    stores: this.stores
  };
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
