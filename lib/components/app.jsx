/**
 * @jsx React.DOM
 */

var React = require('react');
var Content = require('./content.jsx');

var App = React.createClass({
  render: function() {
    return (
      <div>
        <Content path={this.props.path} />
        <footer>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
        </footer>
      </div>
    );
  }
});

module.exports = App;
