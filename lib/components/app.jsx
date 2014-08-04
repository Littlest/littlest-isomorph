/**
 * @jsx React.DOM
 */
var React = require('react');
var About = require('./about.jsx');
var Home = require('./home.jsx');
var NotFound = require('./not-found.jsx');
var User = require('./user.jsx');

var App = React.createClass({
  getMainContent: function (path) {
    if (path === '/') {
      return <Home />;
    } else if (path === '/about') {
      return <About />;
    } else if (/user\/.*/.test(path)) {
      return <User username={this.props.route.userName} />;
    } else {
      return <NotFound />;
    }
  },
  render: function () {
    return (
      <div>
        {this.getMainContent(this.props.path)}
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
