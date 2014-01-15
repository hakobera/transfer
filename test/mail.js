var mail = require('../lib/mail');
var sinon = require('sinon');

var swig = require('swig');
var expected =

describe('mail', function () {
  var spy;

  before(function () {
    sinon.spy(mail, 'send');
  });

  afterEach(function () {
    mail.send.reset();
  });

  describe('#sendAvailableMail', function () {
    it('should send mail', function (done) {
      var item = {
        to: 'test@example.com',
        title: 'Tile of mail',
        comment: 'test',
        downloadUrl: 'http://localhost:3000/download/1'
      };
      var text = swig.renderFile(__dirname + '/../mails/en/available.txt', { item: item });

      var cb = function (err) {
        if (err) return done(err);

        mail.send.calledOnce.should.be.true;
        mail.send.calledWith(
          process.env.MAIL_FROM,
          item.to,
          item.title,
          text,
          cb
        ).should.be.true;

        done();
      };

      mail.sendAvailableMail(item, cb);
    });
  });
});
