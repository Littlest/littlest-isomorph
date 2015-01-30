/*!
 * This Mixin provides good, common practices as methods on React components.
 */
var React = require('react');
var Container = require('./container');
var Context = require('./context');

var Mixin = {
  /**
   * All helper methods require access to Actions and Stores through their
   * `context`.
   */
  contextTypes: Container.AVAILABLE_FUNCTIONS.reduce(function (types, key) {
    types[key] = React.PropTypes.func.isRequired;
    return types;
  }, {}),

  /**
   * This is a mapping of keys in state to properties in Stores. The values
   * can either be a String or a Function that returns a String. These
   * functions will be called with `this` bound to the component instance.
   * The mapped state will be kept as up-to-date as possible, `get`-ting
   * the value during `getInitialState`, (re)mapping the value as props
   * change.
   *
   * NOTE: Do not make mappings conditional on anything other than `props`,
   * as only props changes will trigger a re-mapping.
   */
  // mappings: {},

  /**
   * Load our initial state from any mappings.
   */
  getInitialState: function () {
    var self = this;

    if (!self.mappings) {
      return {};
    }

    return Object.keys(self.mappings)
      .reduce(function (state, key) {
        state[key] = self.get(self._resolveMapping(key));
        return state;
      }, {});
  },

  /**
   * When mounting, initialize our internal state.
   */
  componentWillMount: function () {
    this._contextListeners = {};
    this._activeMappings = {};
  },

  /**
   * When unmounting, automatically deregister event handlers.
   */
  componentWillUnmount: function () {
    var self = this;

    Object.keys(self._contextListeners)
      .forEach(function (key) {
        self.unhandle(key);
      });
  },

  /**
   * Once we're mounted, we can wire up our initial mappings.
   */
  componentDidMount: function () {
    this._activateMappings();
  },

  /**
   * Every time the props update, we need to re-wire our mappings.
   */
  componentWillReceiveProps: function (newProps) {
    // This method is called before the new props are available as
    // `this.props`, which our mappings may rely on. As a result, we have
    // to swap them out artificually.
    var oldProps = this.props;
    this.props = newProps;

    this._activateMappings();

    this.props = oldProps;
  },

  /**
   * Registers a `change` event handler (the only event handler a component
   * should care about). This event handler will be automatically
   * deregistered when the component is unmounted.
   *
   * The format of `path` includes both the Store name and the change event,
   * e.g. `user:change:name`.
   */
  handle: function (path, handler) {
    var parsed = this._parseEventPath(path);

    if (!parsed) {
      // TODO(schoon) - Throw an Error?
      return;
    }

    parsed.store.addListener(parsed.event, handler);

    if (!this._contextListeners[path]) {
      this._contextListeners[path] = [];
    }

    this._contextListeners[path].push(handler);
  },

  /**
   * Unregisters/deregisters a previously-registered `change` event handler.
   *
   * The format of `path` includes both the Store name and the change event,
   * e.g. `user:change:name`.
   *
   * See `handle` for more information.
   */
  unhandle: function (path, handler) {
    var self = this;
    var parsed = self._parseEventPath(path);
    var handlers = self._contextListeners[path];

    if (!parsed) {
      // TODO(schoon) - Throw an Error?
      return;
    }

    function _remove(fn) {
      var index;

      parsed.store.removeListener(parsed.event, fn);

      if (handlers) {
        index = handlers.indexOf(fn);

        if (index !== -1) {
          handlers.splice(handlers.indexOf(fn), 1);
        }
      }
    }

    if (handler) {
      _remove(handler);
    } else if (handlers) {
      // TODO(schoon) - Not having `handlers` should be extraordinary. Throw?
      handlers.forEach(_remove);
    }
  },

  /**
   * Retrieves a property from a Store by a combined path. For example,
   * `get('user:name')` would retrieve the `name` property from the `user`
   * Store, if it exists.
   *
   * If the implied Store doesn't exist, `null` is returned.
   */
  get: function (path) {
    var parsed = this._parseKeyPath(path);

    if (!parsed) {
      return null;
    }

    return parsed.store[parsed.key];
  },

  /**
   * Maps a property in a Store (using the same path semantics as `get`) to
   * a named `key` the component's `state`. Any changes in that property will
   * result in a corresponding `setState` call.
   *
   * See `get` for more information.
   */
  map: function (path, key) {
    var self = this;
    var parsed = self._parseKeyPath(path);
    var eventPath;

    if (!parsed) {
      // TODO(schoon) - Throw an Error?
      return;
    }

    eventPath = path.replace(new RegExp(parsed.key + '$'), 'change:' + parsed.key);

    function update(value) {
      var newState = {};

      newState[key] = value;

      self.setState(newState);
    }

    if (self._activeMappings[key]) {
      self.unhandle(eventPath, self._activeMappings[key]);
    }

    self.handle(eventPath, update);
    self._activeMappings[key] = update;

    update(self.get(path));
  },

  /**
   * Internal helper to parse combined change event paths into an Object
   * with `store` and `event` properties.
   */
  _parseEventPath: function (path) {
    var names = path.split(':change');
    var store = this.context.getStore(names[0]);

    if (!store) {
      return null;
    }

    return {
      store: store,
      event: 'change' + names[1]
    };
  },

  /**
   * Internal helper to parse combined key paths into an Object with `store`
   * and `key` properties.
   */
  _parseKeyPath: function (path) {
    var names = path.split(':');
    var key = names.pop();
    var store;

    while (names.length) {
      store = this.context.getStore(names.join(':'));

      if (store) {
        return {
          store: store,
          key: key
        };
      }

      key = names.pop() + ':' + key;
    }

    return null;
  },

  /**
   * Internal helper to resolve an individual mapping.
   */
  _resolveMapping: function (key) {
    var mapping = this.mappings[key];

    if (typeof mapping === 'function') {
      mapping = mapping.call(this);
    }

    return mapping;
  },

  /**
   * Internal helper to ensure all `mappings` have been activated.
   */
  _activateMappings: function () {
    var self = this;

    Object.keys(self.mappings || {})
      .forEach(function (key) {
        self.map(self._resolveMapping(key), key);
      });
  }
};

/*!
 * Export `Mixin`.
 */
module.exports = Mixin;
