var React = require('react');
var Router = require('./router');

var router = new Router();

function navigate(href) {
  var component = router.getComponent(href);

  if (component) {
    window.history.pushState(null, '', String(href));
    React.renderComponent(component, document.getElementById('app'));
    ajaxifyLinks();
  } else {
    console.log('Not Found:', url.parse(href).pathname);
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
