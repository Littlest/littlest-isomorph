/*!
 * Client.js contains all client-specific code, run immediately only in the
 * browser.
 *
 * Our browser-specific concerns are:
 * - Browser-side routing and navigation.
 * - Browser history preservation and restoration.
 * - Intercepting anchor navigation.
 * - Rehydrating any state received by the server.
 */
var React = require('react');
var Router = require('./router');
var router = new Router();

/**
 * Renders the top-level React Component, the Application, based on the current
 * Router configuration and the passed in `location`.
 *
 * See `Router.getComponent` for more information.
 */
function renderApplication(location) {
  var component = router.getComponent(location);

  if (component) {
    window.history.pushState(null, '', String(location));
    React.renderComponent(component, document.getElementById('app'));
    registerOnClick();
  } else {
    console.log('Not Found:', router.getPath(location));
  }
}

/**
 * Handles anchor navigation by triggering a re-render.
 */
function onclick(event) {
  if (event.ctrlKey) {
    return true;
  }

  renderApplication(this.href);
  return false;
}

/**
 * Registers all necessary onclick handlers for proper navigation.
 */
function registerOnClick() {
  for (var idx = document.links.length; idx--;) {
    document.links[idx].onclick = onclick;
  }
}

/**
 * Rehydrates the application based on the current state.
 */
function rehydrate() {
  renderApplication(window.location);
}

// Rehydrate should be called in two situations: both with the Back button is
// pressed to rehydrate based on browser-stored state, and once content
// initially loads based on server-provided state.
window.onpopstate = rehydrate;
document.addEventListener('DOMContentLoaded', rehydrate);

// Log the top-level configuration for debugging.
console.log('Config:', require('./config'));
