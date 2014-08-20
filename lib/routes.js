var App = require('./components/app.jsx');

module.exports = {
  "index": {
    "path": "/",
    "component": App,
    "method": "get",
    "props": {}
  },
  "about": {
    "path": "/about",
    "component": App,
    "method": "get",
    "props": {}
  },
  "user": {
    "path": "/user/:userName",
    "component": App,
    "method": "get",
    "props": {}
  }
};
