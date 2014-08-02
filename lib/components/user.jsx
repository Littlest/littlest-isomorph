/**
 * @jsx React.DOM
 */
var React = require('react');
var ReactWhen = require('react-when');
var superagent = require('superagent');
var when = require('when');

var User = React.createClass({
  mixins: [ReactWhen.Mixin],
  getInitialStateAsync: function() {
    var self = this;

    return when.promise(function (resolve, reject) {
      superagent
        .get('https://api.github.com/users/' + self.props.username)
        .end(function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res.body);
          }
        });
    });
  },
  render: function() {
    return (
      <div>
        <img src={this.state.avatar_url} alt="Avatar Image" width="128px" heigth="128px" />
        <h1>{this.state.name}</h1>
        <dl>
          <dt>Company:</dt><dd>{this.state.company}</dd>
        </dl>
      </div>
    );
  }
});

module.exports = User;
