var exceptionHandler = require('../lib/exceptionHandler');
var sinon = require('sinon');
var should = require('should');

describe('exceptionHandler', function () {
  it('should write err.stack to stderr', function () {
    var spy = sinon.spy(console, 'error');
    var err = new Error('test');

    exceptionHandler(err);

    spy.calledWith(err.stack).should.be.true;
  });
});
