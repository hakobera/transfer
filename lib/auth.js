var auth = require('basic-auth');
var crypto = require('crypto');
var pswd = require('pswd')({ iterations: 1000 });
var Passwordgen = require('passwordgen');
var passgen = new Passwordgen();

function* isValid(user, data) {
  return user &&
        user.name === (data.to || 'transfer') &&
        (yield* pswd.compare(user.pass, data.hashedPass));
}

module.exports = {
  validate: function* (app, data) {
    var user = auth(app);
    if (yield* isValid(user, data)) {
      return;
    }
    app.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
    app.throw(401);
  },

  create: function* (pass) {
    pass = pass || passgen.chars(10, { symbols: true });
    var hash = yield* pswd.hash(pass);

    return {
      pass: pass,
      hashedPass: hash
    };
  }
};
