var render = require('../lib/render');
var co = require('co');

describe('render', function () {
  it('should return html using swig template', function (done) {
    co(function* () {
      var data = yield render('test', { key: 'value' });
      data.should.eql('<div>value</div>\n');
    })(done);
  });

  it('should throw error when template not found', function (done) {
    co(function* () {
      try {
        yield render('invalid');
      } catch (err) {
        if (err && err.code == 'ENOENT') {
          return;
        }
        throw err;
      }
    })(done);
  });
});
