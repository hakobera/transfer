var i18n = require('i18n');

i18n.configure({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  directory: __dirname + '/../locales',
  updateFiles: false
});

module.exports = i18n;
