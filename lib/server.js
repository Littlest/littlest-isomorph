var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var ecstatic = require('ecstatic');
var connect = require('connect');
var React = require('react');
var Router = require('routr');
var App = require('./components/app');
var routes = require('./routes');

var SHELL = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'index.html'), 'utf8');

var router = new Router(routes);
var app = connect();

app.use(ecstatic({
  root: path.resolve(__dirname, '..', 'public'),
  showDir: false,
  autoIndex: false
}));

app.use(function (req, res, next) {
  var pathname = url.parse(req.url).pathname;
  var route = router.getRoute(pathname, { method: req.method });

  console.log(req.method, req.url, pathname);
  console.log(route);
  // console.log(util._extend({ path: req.path }, route.config.props));

  if (route) {
    res.writeHeader(200, {
      'Content-Type': 'text/html'
    });
    res.end(util.format(SHELL, React.renderComponentToString(App(util._extend({ path: pathname }, route.config.props)))));
  } else {
    res.writeHeader(404, {
      'Content-Type': 'text/plain'
    });
    res.end('Not Found');
  }
});

module.exports = app;
