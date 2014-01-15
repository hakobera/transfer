var request = require('supertest');
var agent = require('superagent');
var should = require('should');

var app = require('../app');

describe('app', function () {
  this.timeout(10000);

  describe('POST /api/register', function () {
    it('with minimum parameter', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({
        filename: 'test.json'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);

        var data = res.body;

        should.exists(data.id);
        should.exists(data.uploadUrl);
        should.exists(data.password);
        data.filename.should.equal('test.json');
        data.locale.should.equal('en');
        data.state.should.equal('preparing');
        data.downloadUrl.should.equal('http://localhost:3000/download/' + data.id);

        // check upload url
        agent
        .put(data.uploadUrl)
        .send(JSON.stringify({ key: 'value' }))
        .set('Content-Type', 'binary/octet-stream')
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
      });
    });

    it('with full parameters', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({
        filename: 'test.json',
        to: 'test@example.com',
        locale: 'ja',
        title: 'test title',
        comment: 'test comment',
        password: 'pass'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);

        var data = res.body;

        should.exists(data.id);
        should.exists(data.uploadUrl);
        data.password.should.equal('pass');
        data.filename.should.equal('test.json');
        data.locale.should.equal('ja');
        data.state.should.equal('preparing');
        data.downloadUrl.should.equal('http://localhost:3000/download/' + data.id);
        data.to.should.equal('test@example.com');
        data.title.should.equal('test title');
        data.comment.should.equal('test comment');

        // check upload url
        agent
        .put(data.uploadUrl)
        .send(JSON.stringify({ key: 'value' }))
        .set('Content-Type', 'binary/octet-stream')
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
      });
    });

    it('missing filename', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({})
      .expect(400)
      .end(done);
    });

    it('missing title when to is set', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({
        filename: 'test.json',
        to: 'test@example.com'
      })
      .expect(400)
      .end(done);
    });
  });

  describe('POST /api/delete/:id', function () {
    it('should set status to delete', function (done) {
      var server = app.listen();

      request(server)
      .post('/api/register')
      .send({ filename: 'test.json' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        var id = res.body.id;

        request(server)
        .post('/api/delete/' + id)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          var data = res.body;
          data.id.should.equal(id);
          data.state.should.equal('deleted');
          done();
        });
      });
    });

    it('should return 404 before register', function (done) {
      request(app.listen())
      .post('/api/delete/invalid')
      .expect(404)
      .end(done);
    });
  });

  describe('POST /api/complete/:id', function () {
    it('should return 404 before register', function (done) {
      request(app.listen())
      .post('/api/complete/invalid')
      .expect(404)
      .end(done);
    });

    it('should return 400 before upload', function (done) {
      var server = app.listen();

      request(server)
      .post('/api/register')
      .send({ filename: 'test.json' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        var id = res.body.id;
        request(server)
        .post('/api/complete/' + id)
        .expect(400)
        .end(done);
      });
    });

    it('should return 400 after delete', function (done) {
      var server = app.listen();

      request(server)
      .post('/api/register')
      .send({ filename: 'test.json' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        var id = res.body.id;

        request(server)
        .post('/api/delete/' + id)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          request(server)
          .post('/api/complete/' + id)
          .expect(400)
          .end(done);
        });
      });
    });

    it('should return completed info', function (done) {
      var server = app.listen();

      request(server)
      .post('/api/register')
      .send({ filename: 'test.json' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        var id = res.body.id;
        var uploadUrl = res.body.uploadUrl;

        agent
        .put(uploadUrl)
        .send(JSON.stringify({ key: 'value' }))
        .set('Content-Type', 'binary/octet-stream')
        .end(function (err, res) {
          if (err) return done(err);

          request(server)
          .post('/api/complete/' + id)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            console.log('=== complete end ===');

            var data = res.body;

            data.id.should.equal(id);
            data.filename.should.equal('test.json');
            data.locale.should.equal('en');
            data.state.should.equal('available');
            should.exists(data.expires);

            done();
          });
        });
      });
    });
  });

  describe('GET /api/download/:id', function () {
    it('should return signed download URL', function (done) {
      var server = app.listen();

      console.log('=== register start ===');
      request(server)
      .post('/api/register')
      .send({ filename: 'test.json' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        console.log('=== register end ===');
        console.log('=== upload start ===');
        var id = res.body.id;
        var uploadUrl = res.body.uploadUrl;
        var pass = res.body.password;
        var auth = 'Basic ' + new Buffer('transfer:' + pass).toString('base64');

        agent
        .put(uploadUrl)
        .send(JSON.stringify({ key: 'value' }))
        .set('Content-Type', 'binary/octet-stream')
        .end(function (err, res) {
          if (err) return done(err);

          console.log('=== upload end ===');
          console.log('=== complete start ===');

          request(server)
          .post('/api/complete/' + id)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            console.log('=== complete end ===');
            console.log('=== download start ===');

            request(server)
            .get('/api/download/' + id)
            .set('Authorization', auth)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err);

              var data = res.body;
              data.id.should.equal(id);
              should.exists(data.downloadUrl);
              done();
            });
          });
        });
      });
    });
  });
});
