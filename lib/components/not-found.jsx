/**
 * @jsx React.DOM
 */
var React = require('react');

var NotFound = React.createClass({
  render: function () {
    return (
      <div>
        <h1>Missing Content</h1>
        <p>No content for <code>{this.props.path}</code>.</p>
      </div>
    );
  }
});

module.exports = NotFound;
