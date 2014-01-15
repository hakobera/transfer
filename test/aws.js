// patch for travis-ci
var AWS = require('aws-sdk');
AWS.config.update({
  httpOptions: {
    timeout: 0
  }
});

var aws = require('../lib/aws');
var should = require('should');
var sinon = require('sinon');
var uuid = require('node-uuid');

describe('aws', function () {

  describe('#putItem', function () {
    it('should store specified data', function (done) {
      var id = uuid.v1();
      aws.putItem({ id: id })(function (err, data) {
        if (err) return done(err);
        done(err);
      });
    });

    it('should throw error when data.id is empty', function (done) {
      var id = uuid.v1();
      aws.putItem({ key: 'value' })(function (err, data) {
        if (err && err.message === 'One or more parameter values were invalid: Missing the key id in the item') {
          return done();
        }
        if (err) return done(err);
        done(new Error('ValidationException should throw.'));
      });
    });
  });

});
