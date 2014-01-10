var nodemailer = require('nodemailer');
var swig = require('swig');
var exceptionHandler = require('./exceptionHandler');
var transport;

if (process.env.MAILGUN_SMTP_LOGIN) {
  transport = nodemailer.createTransport('SMTP', {
    service: 'Mailgun',
    auth: {
      user: process.env.MAILGUN_SMTP_LOGIN,
      pass: process.env.MAILGUN_SMTP_PASSWORD
    },
    debug: process.env.NODE_ENV !== 'production'
  });
} else {
  transport = nodemailer.createTransport('SES', {
    AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID,
    AWSSecretKey: process.env.AWS_SECRET_ACCESS_KEY
  });
}

function send(from, to, subject, text) {
  var mail = {
    from: from,
    to: to,
    subject: subject,
    text: text
  };

  console.log('send mail', mail);

  if (transport) {
    transport.sendMail(mail, function (err, response) {
      if (err) {
        console.error(err.stack);
        exceptionHandler(err);
        return;
      }
      console.log('Send mail to %s success.', mail.to)
    });
  }
}

module.exports = {
  sendPreparingMail: function (item, url) {
    var text = swig.renderFile(__dirname + '/../mails/preparing.txt', {
      item: item,
      url: url
    });
    send(process.env.MAIL_FROM, item.to, item.preparingMailSubject, text);
  },

  sendAvailableMail: function (item, url, user, pass) {
    var text = swig.renderFile(__dirname + '/../mails/available.txt', {
      item: item,
      url: url,
      user: user,
      pass: pass
    });
    send(process.env.MAIL_FROM, item.to, item.availableMailSubject, text);
  }
};
