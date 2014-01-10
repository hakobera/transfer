var nodemailer = require('nodemailer');
var swig = require('swig');
var exceptionHandler = require('./exceptionHandler');
var transport;

if (process.env.MAILGUN_SMTP_LOGIN) {
  transport = nodemailer.createTransport("SMTP", {
    service: 'Mailgun',
    auth: {
      user: process.env.MAILGUN_SMTP_LOGIN,
      pass: process.env.MAILGUN_SMTP_PASSWORD
    },
    debug: process.env.NODE_ENV !== 'production'
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
      }
    });
  }
}

module.exports = {
  sendPreparingMail: function (item, url) {
    var text = swig.renderFile(__dirname + '/../mails/preparing.txt', {
      item: item,
      url: url
    });
    send(item.from, item.to, item.preparingMailSubject, text);
  },

  sendAvailableMail: function (item, url, user, pass) {
    var text = swig.renderFile(__dirname + '/../mails/available.txt', {
      item: item,
      url: url,
      user: user,
      pass: pass
    });
    send(item.from, item.to, item.availableMailSubject, text);
  }
};
