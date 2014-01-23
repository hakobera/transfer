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
        subject: 'Tile of mail',
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
          item.subject,
          text,
          cb
        ).should.be.true;

        done();
      };

      mail.sendAvailableMail(item, cb);
    });

    it('should not send mail if item.to is not set', function (done) {
      var item = {};
      mail.sendAvailableMail(item, function (err) {
        if (err) return done(err);
        mail.send.called.should.be.false;
        done();
      });
    });
  });

  describe('#sendRegisterMail', function () {
    it('should send mail', function (done) {
      var item = {
        to: 'test@example.com',
        subject: 'Tile of mail',
        registerSubject: 'Register mail',
        comment: 'test',
        downloadUrl: 'http://localhost:3000/download/1'
      };
      var text = swig.renderFile(__dirname + '/../mails/en/register.txt', { item: item });

      var cb = function (err) {
        if (err) return done(err);

        mail.send.calledOnce.should.be.true;
        mail.send.calledWith(
          process.env.MAIL_FROM,
          item.to,
          item.registerSubject,
          text,
          cb
        ).should.be.true;

        done();
      };

      mail.sendRegisterMail(item, cb);
    });

    it('should not send mail if item.to is not set', function (done) {
      var item = {};
      mail.sendRegisterMail(item, function (err) {
        if (err) return done(err);
        mail.send.called.should.be.false;
        done();
      });
    });

    it('should not send mail if item.registerSubject is not set', function (done) {
      var item = { to: 'test@example.com '};
      mail.sendRegisterMail(item, function (err) {
        if (err) return done(err);
        mail.send.called.should.be.false;
        done();
      });
    });
  });

  describe('#subject', function () {
    it('should return registerSubject with prefix when register', function () {
      var item = { subject: 'Subject', registerSubject: 'Register Subject' };
      mail.subject(item, 'register').should.equal('Register Subject');
    });

    it('should return subject when available', function () {
      var item = { subject: 'Subject', registerSubject: 'Register Subject' };
      mail.subject(item, 'available').should.equal('Subject');
    });
  });
});
