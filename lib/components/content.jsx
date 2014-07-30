/**
 * @jsx React.DOM
 */

var React = require('react');

var Content = React.createClass({
  render: function() {
    if (this.props.path === '/') {
      return (
        <div>
          <h1>Home</h1>
          <p>This is the home page.</p>
        </div>
      );
    } else if (this.props.path === '/about') {
      return (
        <div>
          <h1>About</h1>
          <p>This is the about page.</p>
        </div>
      );
    } else {
      return (
        <div>
          <h1>Missing Content</h1>
          <p>Not content for <code>{this.props.path}</code>.</p>
        </div>
      );
    }
  }
});

module.exports = Content;
