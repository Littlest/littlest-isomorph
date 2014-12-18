var Mixin = require('../../../lib/mixin');
var React = require('react');

var MixedInComponent = React.createClass({
  mixins: [Mixin],
  mappings: {
    foo: 'test:foo',
    data: function () { return 'answers:everything'; }
  },
  render: function () {
    return React.createElement('div', { className: 'mixed-in'},
      React.createElement('span', { className: 'foo' }, this.state.foo),
      React.createElement('span', { className: 'data' }, this.state.data),
      React.createElement('pre', { className: 'context' }, JSON.stringify(Object.keys(this.context)))
    );
  }
});

module.exports = MixedInComponent;
