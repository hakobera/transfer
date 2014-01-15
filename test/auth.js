var auth = require('../lib/auth');
var co = require('co');
var pswd = require('pswd')({ iterations: 1000 });
var sinon = require('sinon');

describe('auth', function () {

  describe('#create', function () {
    it('should return password length of 10', function (done) {
      co(function *() {
        var credential = yield* auth.create();
        credential.pass.should.have.length(10);

        var valid = yield* pswd.compare(credential.pass, credential.hashedPass);
        valid.should.be.true;
      })(done);
    });
  });

  describe('#validate', function () {
    function dummyReq(pass) {
      var req = {
        headers: {},
        set: function (key, value) {},
        throw: function (status, message) {}
      };

      if (pass) {
        req.headers.authorization = 'Basic ' + new Buffer('transfer:' + pass).toString('base64');
      }

      sinon.spy(req, 'set');
      sinon.spy(req, 'throw');

      return req;
    }

    it('should not throw 401 when valid password is provided', function (done) {
      co(function *() {
        var pass = 'pass';
        var req = dummyReq(pass);
        var data = { hashedPass: yield* pswd.hash(pass) };
        var ret = yield* pswd.compare(pass, data.hashedPass);
        yield* auth.validate(req, data);

        req.throw.called.should.be.false;
      })(done);
    });

    it('should throw 401 when no password is provided', function (done) {
      co(function *() {
        var pass = 'pass';
        var req = dummyReq();
        var data = { hashedPass: yield* pswd.hash(pass) };
        yield* auth.validate(req, data);

        req.set.calledWith('WWW-Authenticate', 'Basic realm="Authorization Required"').should.be.true;
        req.throw.calledWith(401).should.be.true;
      })(done);
    });

    it('should throw 401 when invalid password is provided', function (done) {
      co(function *() {
        var pass = 'pass';
        var req = dummyReq('invalid');
        var data = { hashedPass: yield* pswd.hash(pass) };
        yield* auth.validate(req, data);

        req.set.calledWith('WWW-Authenticate', 'Basic realm="Authorization Required"').should.be.true;
        req.throw.calledWith(401).should.be.true;
      })(done);
    });
  });
});
