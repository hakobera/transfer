var raven = require('raven');
var client;

if (process.env.RAVEN_URL) {
  client = new raven.Client('https://e3e5ec793223453895a32f86834a5641:077554caa7a448a09739cc0a811e7be7@app.getsentry.com/17718');
  client.patchGlobal();
}

module.exports = function (err) {
  console.error(err.stack);
  if (client) {
    client.captureError(err);
  }
};
