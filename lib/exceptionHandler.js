var raven = require('raven');
var client;

if (process.env.SENTRY_DSN) {
  client = new raven.Client(process.env.SENTRY_DSN);
  client.patchGlobal();
}

module.exports = function (err) {
  console.error(err.stack);
  if (client) {
    client.captureError(err);
  }
};
