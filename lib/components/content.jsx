/**
 * @jsx React.DOM
 */
var React = require('react');

var Content = React.createClass({
  render: function () {
    switch (this.props.path) {
      case '/':
        return (
          <div>
            <h1>Home</h1>
            <p>This is the home page.</p>
          </div>
        );
        break;
      case '/about':
        return (
          <div>
            <h1>About</h1>
            <p>Config:</p>
            <pre><code>{JSON.stringify(this.props.config, null, 2)}</code></pre>
          </div>
        );
      default:
        return (
          <div>
            <h1>Missing Content</h1>
            <p>No content for <code>{this.props.path}</code>.</p>
          </div>
        );
    }
  }
});

module.exports = Content;
