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
var util = require('util');
var ecstatic = require('ecstatic');
var connect = require('connect');
var morgan = require('morgan');
var React = require('react');
var ReactWhen = require('react-when');
var Router = require('./router');
var router = new Router();
var app = connect();

// Rather than render the top-level layout as a React component, we can store
// the "shell" as a genuine, bonified, HTML file. Then, with a simple
// `String.replace` call, we can emulate the bahaviour of the
// `React.renderComponent` call we use on the client.
var SHELL = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'index.html'), 'utf8')
  .replace(/(id="app">)[\s]*(<\/)/, '$1%s$2');

function renderResponse(component) {
  return ReactWhen.renderComponentToStringAsync(component)
    .then(function (html) {
      return util.format(SHELL, html);
    });
}

// Install a development-focused logger.
// NOTE: On a production site, this should be a more comprehensive solution.
app.use(morgan('dev'));

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

  renderResponse(component)
    .then(function (html) {
      res.writeHeader(component._store.props.route ? 200 : 404, {
        'Content-Type': 'text/html'
      });
      res.end(html);
    }, function (err) {
      res.writeHeader(500, {
        'Content-Type': 'text/plain'
      });
      // NOTE: On a production site, these errors should be handled in a more
      // user-friendly manner.
      res.end(err.stack);
    })
    .done();
});

/*!
 * Export `app`.
 */
module.exports = app;
