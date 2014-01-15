var request = require('supertest');
var agent = require('superagent');
var should = require('should');

var app = require('../app');

describe('app', function () {
  this.timeout(15000);

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
        data.filename.should.equal('test.json');
        data.locale.should.equal('en');
        data.state.should.equal('preparing');
        data.downloadUrl.should.equal('http://localhost:3000/download/' + data.id);
        done();
      });
    });

    it('with full parameters', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({
        filename: 'test.json',
        recipient: 'test@example.com',
        locale: 'ja',
        title: 'test title',
        comment: 'test comment'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);

        var data = res.body;

        should.exists(data.id);
        should.exists(data.uploadUrl);
        data.filename.should.equal('test.json');
        data.locale.should.equal('ja');
        data.state.should.equal('preparing');
        data.downloadUrl.should.equal('http://localhost:3000/download/' + data.id);
        data.to.should.equal('test@example.com');
        data.title.should.equal('test title');
        data.comment.should.equal('test comment');
        done();
      });
    });

    it('missing filename', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({})
      .expect(400)
      .end(done);
    });

    it('missing title when recipient is set', function (done) {
      request(app.listen())
      .post('/api/register')
      .send({
        filename: 'test.json',
        recipient: 'test@example.com'
      })
      .expect(400)
      .end(done);
    });
  });

  describe('all flow', function () {
    it('should register, upload, complete', function (done) {
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

            var data = res.body;

            data.id.should.equal(id);
            data.filename.should.equal('test.json');
            data.locale.should.equal('en');
            should.exists(data.pass);
            should.exists(data.expires);
            data.downloadUrl.should.equal('http://localhost:3000/download/' + data.id);

            console.log(data);
            done();
          });
        });
      });
    });
  });
});