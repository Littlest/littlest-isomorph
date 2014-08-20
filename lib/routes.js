var App = require('./components/app.jsx');

module.exports = {
  "index": {
    "path": "/"
  },
  "about": {
    "path": "/about"
  },
  "user": {
    "path": "/user/:userName"
  },
  "defaults": {
    "component": App,
    "method": "get",
    "props": {}
  }
};
