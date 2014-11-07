/*!
 * This Mixin provides good, common practices as methods on React components.
 */
var Context = require('./context');

/**
 * To avoid creating a duplicate React dependency and break their internal
 * invariants, the Mixin accepts the universal React module as an argument.
 */
var Mixin = function (React) {
  return {
    /**
     * All helper methods require a `context`. Though it is _strongly
     * recommended_ to pass in a Context (with top-level components receiving
     * the Context via the Client) as `props`, you can provide an alternative
     * Context to this mixin with `getDefaultProps`.
     */
    propTypes: {
      context: React.PropTypes.instanceOf(Context).isRequired
    },

    /**
     * When mounting, initialize our internal state.
     */
    componentWillMount: function () {
      this._contextListeners = {};
    },

    /**
     * When unmounting, automatically deregister event handlers.
     */
    componentWillUnmount: function () {
      var self = this;

      Object.keys(self._contextListeners)
        .forEach(function (key) {
          self.unhandle(key, self._contextListeners[key]);
        });
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
      this._contextListeners[path] = handler;
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
      var parsed = this._parseEventPath(path);

      if (!parsed) {
        // TODO(schoon) - Throw an Error?
        return;
      }

      parsed.store.removeListener(parsed.event, handler);
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

      self.handle(eventPath, update);
      update(self.get(path));
    },

    /**
     * Internal helper to parse combined change event paths into an Object
     * with `store` and `event` properties.
     */
    _parseEventPath: function (path) {
      var names = path.split(':change');
      var store = this.props.context.getStore(names[0]);

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
        store = this.props.context.getStore(names.join(':'));

        if (store) {
          return {
            store: store,
            key: key
          };
        }

        key = names.pop() + ':' + key;
      }

      return null;
    }
  };
};

/*!
 * Export `Mixin`.
 */
module.exports = Mixin;
