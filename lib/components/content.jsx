/**
 * @jsx React.DOM
 */
var React = require('react');
var User = require('./user.jsx');

var Content = React.createClass({
  render: function () {
    if (this.props.path.indexOf('/user') === 0) {
      return (
        <User username={this.props.route.userName} />
      );
    }

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
