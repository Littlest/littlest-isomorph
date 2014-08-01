/*!
 * Server.js contains all server-specific code, run immediately only on the
 * server.
 *
 * Our server-specific concerns are:
 * - Serving static and compiled files.
 * - Server-side routing and rendering initial content.
 * - Bad or old links (404, 301, etc.)
 */
var fs = require('fs');
var path = require('path');
var ecstatic = require('ecstatic');
var connect = require('connect');
var React = require('react');
var Router = require('./router');
var router = new Router();
var app = connect();

// Rather than render the top-level layout as a React component, we can store
// the "shell" as a genuine, bonified, HTML file. Then, with a simple
// `String.replace` call, we can emulate the bahaviour of the
// `React.renderComponent` call we use on the client.
var SHELL = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'index.html'), 'utf8');
var TARGET = /(id="app">)[\s]*(<\/)/;

function renderResponse(component) {
  return SHELL.replace(TARGET, '$1' + React.renderComponentToString(component) + '$2');
}

// Ecstatic middleware for static files. Ecstatic should fall through on _all_
// unknown routes.
app.use(ecstatic({
  root: path.resolve(__dirname, '..', 'public'),
  showDir: false,
  autoIndex: false
}));

// If the request URL is valid, this renders the top-level component, the
// Application, based on the current Router configuration. Otherwise, a 404
// is generated.
app.use(function (req, res, next) {
  var component = router.getComponent(req.url, { method: req.method });

  if (component) {
    res.writeHeader(200, {
      'Content-Type': 'text/html'
    });
    res.end(renderResponse(component));
  } else {
    res.writeHeader(404, {
      'Content-Type': 'text/plain'
    });
    res.end('Not Found');
  }
});

/*!
 * Export `app`.
 */
module.exports = app;
