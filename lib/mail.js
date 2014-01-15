var nodemailer = require('nodemailer');
var swig = require('swig');
var util = require('util');
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
} else if (process.env.USE_SES) {
  transport = nodemailer.createTransport('SES', {
    AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID,
    AWSSecretKey: process.env.AWS_SECRET_ACCESS_KEY
  });
}

function send(from, to, subject, text, callback) {
  var mail = {
    from: from,
    to: to,
    subject: subject,
    text: text
  };
  var callback = callback || function () {};

  if (transport) {
    transport.sendMail(mail, function (err, response) {
      if (err) {
        console.error(err.stack);
        exceptionHandler(err);
        callback(err);
        return;
      }
      console.log('Send mail to %s success.', mail.to);
      callback();
    });
  } else {
    console.log('Send mail to %s success.', mail.to);
    setImmediate(callback);
  }
}

function template(name, item) {
  var supported_locales = ['en', 'ja'];
  var locale = 'en';
  supported_locales.forEach(function (sl) {
    if (sl === item.locale) {
      locale = sl;
    }
  });
  return util.format('%s/../mails/%s/%s.txt', __dirname, locale, name);
}

module.exports = {
  sendAvailableMail: function (item, callback) {
    var text = swig.renderFile(template('available', item), {
      item: item
    });
    this.send(process.env.MAIL_FROM, item.to, item.title, text, callback);
  },

  send: send
};
