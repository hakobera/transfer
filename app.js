/**
 * Module dependencies.
 */

var responseTime = require('koa-response-time');
var compress = require('koa-compress');
var logger = require('koa-logger');
var route = require('koa-route');
var serve = require('koa-static');
var parse = require('co-body');
var uuid = require('node-uuid');
var raven = require('raven');
var util = require('util');
var aws = require('./lib/aws');
var render = require('./lib/render');
var auth = require('./lib/auth');
var state = require('./lib/state');
var mail = require('./lib/mail');
var exceptionHandler = require('./lib/exceptionHandler');
var koa = require('koa');

/**
 * Environments.
 */

var env = process.env.NODE_ENV || 'development';
var port = process.env.PORT || 3000;
var host = process.env.HOST || 'http://localhost:' + port;

function downloadUrl(id) {
  return util.format('%s/download/%s', host, id);
}

/**
 * Middleware settings.
 */

var app = module.exports = koa();

app.use(responseTime());

if (env !== 'test') {
  app.use(logger());
}

if (env === 'production') {
  app.jsonSpaces = 0;
  app.use(compress());
}

/**
 * API route
 */

app.use(route.post('/api/register', function *() {
  var body = yield parse(this, { limit: '1mb' });
  console.log(body);

  if (!body.filename && !body.contentType) {
    this.throw(400, 'filename or contentType is required.');
  }

  var id = uuid.v1();
  var signedUrl = yield aws.signedUploadUrl({
    id: id,
    filename: body.filename
  });

  var item = {
    id: id,
    filename: body.filename,
    url: signedUrl,
    state: state.PREPARING,
    to: body.recipient,
    preparingMailSubject: body.preparing_mail.title,
    preparingMailText: body.preparing_mail.body,
    availableMailSubject: body.available_mail.title,
    availableMailText: body.available_mail.body
  };

  yield aws.putItem(item);

  this.body = item;

  mail.sendPreparingMail(item, downloadUrl(id));
}));

app.use(route.post('/api/complete/:id', function *(id) {
  var item = yield aws.getItem(id);
  if (!item.id) {
    this.throw(404, 'Not Found');
  }

  if (item.state !== state.PREPARING) {
    this.throw(400, 'Already completed');
  }

  if (!(yield aws.isFileExist(item.id))) {
    this.throw(400, 'File does not exists');
  }

  var user = yield* auth.create();

  item.state = state.READY;
  item.userName = user.name;
  item.hashedPass = user.hashedPass;

  yield aws.putItem(item);

  item.pass = user.pass;
  this.body = item;

  mail.sendAvailableMail(item, downloadUrl(id), item.userName, item.pass);
}));

app.use(route.get('/api/download/:id', function *(id) {
  var data = yield aws.getItem(id);
  if (!data.id || data.state !== state.READY) {
    this.throw(404, 'Not Found');
  }

  if (!(yield aws.isFileExist(item.id))) {
    this.throw(410, 'File is removed');
  }

  yield* auth.validate(this, data);

  var signedUrl = yield aws.signedDownloadUrl(data);
  this.body = {
    id: id,
    url: signedUrl
  };
}));

app.use(route.post('/api/delete/:id', function *(id) {
  var item = yield aws.getItem(id);
  if (!item.id) {
    this.throw(404, 'Not Found');
  }

  item.state = state.DELETED;

  yield aws.putItem(item);

  this.body = item;
}));

/**
 * Page route
 */

app.use(route.get('/download/:id', function *(id) {
  var data = yield aws.getItem(id);
  if (!data.id) {
    this.throw(404, 'Not Found');
  }

  yield* auth.validate(this, data);

  if (data.state === state.READY) {
    if (!(yield aws.isFileExist(item.id))) {
      this.throw(410, 'File is removed');
    }

    var signedUrl = yield aws.signedDownloadUrl(data);
    this.body = yield render('download', { url: signedUrl });
  } else {
    this.body = yield render('preparing');
  }
}));

/**
 * Static files.
 */

app.use(serve('public'));

/**
 * Error handling.
 */

app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = 500;
    this.body = {
      message: err.message
    };
    this.app.emit('error', err, this);
  }
});

app.on('error', function(err){
  exceptionHandler(err);
});

/**
 * Run server
 */

app.listen(port, function () {
  console.log('app running on %d', port);
});
