/**
 * @jsx React.DOM
 */
var React = require('react');

var About = React.createClass({
  render: function () {
    return (
      <div>
        <h1>About</h1>
        <p>Config:</p>
        <pre><code>{JSON.stringify(this.props.config, null, 2)}</code></pre>
      </div>
    );
  }
});

module.exports = About;
