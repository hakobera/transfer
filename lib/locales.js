var supportedLocales = ['en', 'es', 'id', 'ja', 'th'];

exports.detect = function (item) {
  var locale = supportedLocales[0];
  var match = false;

  supportedLocales.forEach(function (l) {
    if (item.locale && l === item.locale.toLowerCase()) {
      locale = l;
      match = true;
    }
  });

  // Search short contry name if locale not exactly match
  if (!match && item.locale && item.locale.length > 2) {
    supportedLocales.forEach(function (l) {
      if (item.locale && l === item.locale.toLowerCase().substr(0, 2)) {
        locale = l;
        match = true;
      }
    });
  }

  return locale;
};

exports.supportedLocales = supportedLocales;
