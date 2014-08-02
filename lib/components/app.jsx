/**
 * @jsx React.DOM
 */
var React = require('react');
var Content = require('./content.jsx');
var User = require('./user.jsx');

var App = React.createClass({
  render: function () {
    return (
      <div>
        <Content path={this.props.path} route={this.props.route} config={this.props.config} />
        <footer>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/user/schoonology">Schoonology</a></li>
            </ul>
          </nav>
        </footer>
      </div>
    );
  }
});

module.exports = App;
