var should = require('should');
var render = require('../lib/render');

describe('render', function () {
  it('should return html using swig template', function (done) {
    render('test', { key: 'value' })(function (err, data) {
      if (err) return done(err);
      data.should.eql('<div>value</div>\n');
      done();
    });
  });

  it('should throw error when template not found', function (done) {
    render('invalid')(function (err, data) {
      if (err && err.code == 'ENOENT') {
        return done();
      }
      done(new Error("Error with code 'ENOENT' should be thrown."));
    });
  });
});
