var Client = require('./client');
var Renderer = require('./renderer');
var Router = require('./router');

module.exports = {
  Client: Client,
  createClient: Client.createClient,
  Renderer: Renderer,
  createRenderer: Renderer.createRenderer,
  Router: Router,
  createRouter: Router.createRouter
};
