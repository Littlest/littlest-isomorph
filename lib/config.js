/*!
 * Config.js is responsible for rendering the top-level configuration as
 * required by client, server, or both. _No information should exist here that
 * cannot be seen by the client_, as Browserify will bundle the generated
 * code with the client.
 *
 * If the configuration doesn't seem to match on the client and on the server,
 * _make sure the same environment variables are specified on both!_
 */
module.exports = {
  env: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 8080
};
