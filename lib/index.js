var Client = require('./client');
var renderer = require('./renderer');
var Router = require('./Router');

module.exports = {
  Client: Client,
  createClient: Client,
  renderer: renderer,
  Router: Router,
  createRouter: Router
};
