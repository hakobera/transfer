var nodemailer = require('nodemailer');
var swig = require('swig');
var util = require('util');
var exceptionHandler = require('./exceptionHandler');
var transport;
var mockTransport = {
  sendMail: function (mail, callback) {
    console.log('Send mail success.', mail);
    process.nextTick(callback);
  }
};

if (process.env.NODE_ENV === 'test') {
  transport = mockTransport;
} else if (process.env.MAILGUN_SMTP_LOGIN) {
  transport = nodemailer.createTransport('SMTP', {
    service: 'Mailgun',
    auth: {
      user: process.env.MAILGUN_SMTP_LOGIN,
      pass: process.env.MAILGUN_SMTP_PASSWORD
    },
    debug: process.env.NODE_ENV !== 'production'
  });
} else if (process.env.SENDGRID_USERNAME) {
  transport = nodemailer.createTransport('SMTP', {
    service: 'SendGrid',
    auth: {
      user: process.env.SENDGRID_USERNAME,
      pass: process.env.SENDGRID_PASSWORD
    },
    debug: process.env.NODE_ENV !== 'production'
  });
} else if (process.env.USE_SES) {
  transport = nodemailer.createTransport('SES', {
    AWSAccessKeyID: process.env.AWS_ACCESS_KEY_ID,
    AWSSecretKey: process.env.AWS_SECRET_ACCESS_KEY
  });
} else {
  transport = mockTransport;
}

module.exports = {
  sendAvailableMail: function (item, callback) {
    this.sendTemplateMail('available', item, callback);
  },

  sendRegisterMail: function (item, callback) {
    this.sendTemplateMail('register', item, callback);
  },

  sendTemplateMail: function (templateName, item, callback) {
    callback = callback || function () {};
    if (this.isSendable(item, templateName)) {
      var text = swig.renderFile(this.template(templateName, item), {
        item: item
      });
      this.send(process.env.MAIL_FROM, item.to, this.subject(item, templateName), text, callback);
    } else {
      process.nextTick(callback);
    }
  },

  send: function (from, to, subject, text, callback) {
    var mail = {
      from: from,
      to: to,
      subject: subject,
      text: text
    };

    transport.sendMail(mail, function (err, response) {
      if (err) {
        console.error(err.stack);
        exceptionHandler(err);
        callback(err);
        return;
      }
      callback();
    });
  },

  template: function (name, item) {
    var supported_locales = ['en', 'ja'];
    var locale = 'en';
    supported_locales.forEach(function (sl) {
      if (sl === item.locale) {
        locale = sl;
      }
    });
    return util.format('%s/../mails/%s/%s.txt', __dirname, locale, name);
  },

  subject: function (item, type) {
    if (type === 'register') {
      return item.registerSubject;
    } else {
      return item.subject;
    }
  },

  isSendable: function (item, type) {
    if (type === 'register') {
      return !!(item.to && item.registerSubject);
    } else {
      return !!item.to;
    }
  }
};
