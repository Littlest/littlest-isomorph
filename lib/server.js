var fs = require('fs');
var path = require('path');
var util = require('util');
var ecstatic = require('ecstatic');
var connect = require('connect');
var React = require('react');
var Router = require('./router');

var SHELL = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'index.html'), 'utf8');

var router = new Router();
var app = connect();

app.use(ecstatic({
  root: path.resolve(__dirname, '..', 'public'),
  showDir: false,
  autoIndex: false
}));

app.use(function (req, res, next) {
  var component = router.getComponent(req.url, { method: req.method });

  if (component) {
    res.writeHeader(200, {
      'Content-Type': 'text/html'
    });
    res.end(util.format(SHELL, React.renderComponentToString(component)));
  } else {
    res.writeHeader(404, {
      'Content-Type': 'text/plain'
    });
    res.end('Not Found');
  }
});

module.exports = app;
