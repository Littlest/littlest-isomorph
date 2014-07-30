var url = require('url');
var util = require('util');
var React = require('react');
var Router = require('routr');
var routes = require('./routes');
var App = require('./components/app.jsx');

var router = new Router(routes);

function navigate(href) {
  var pathname = url.parse(String(href)).pathname;
  var route = router.getRoute(pathname);

  if (route) {
    window.history.pushState(null, '', String(href));
    React.renderComponent(App(util._extend({ path: pathname }, route.config.props)), document.getElementById('app'));
    ajaxifyLinks();
  } else {
    console.log('Not Found:', url.parse(this.href).pathname);
  }
}

function pushStateNav(event) {
  if (event.ctrlKey) {
    return true;
  }

  navigate(this.href);
  return false;
}

window.onpopstate = function (event) {
  navigate(window.location);
};

document.addEventListener('DOMContentLoaded', function () {
  ajaxifyLinks();
});

function ajaxifyLinks() {
  for (var idx = document.links.length; idx--;) {
    document.links[idx].onclick = pushStateNav;
  }
}
