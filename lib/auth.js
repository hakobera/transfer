var auth = require('basic-auth');
var crypto = require('crypto');
var pswd = require('pswd')({ iterations: 1000 });

function randomString(length) {
  return function (fn) {
    crypto.randomBytes(length, function(err, buf) {
      if (err) return fn(err);
      fn(null, buf.toString('hex'));
    });
  };
}

module.exports = {
  validate: function* (app, data) {
    var user = auth(app);
    if (!user || user.name !== data.userName || !(yield* pswd.compare(user.pass, data.hashedPass))) {
      app.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
      app.throw(401);
    }
  },

  create: function* () {
    var name = yield randomString(4);
    var pass = yield randomString(8);
    var hash = yield* pswd.hash(pass);

    return {
      name: name,
      pass: pass,
      hashedPass: hash
    };
  }
};
