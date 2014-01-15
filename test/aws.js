var aws = require('../lib/aws');
var should = require('should');
var sinon = require('sinon');
var uuid = require('node-uuid');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var s3 = new AWS.S3();

describe('aws', function () {
  this.timeout(5000);

  describe('#putItem', function () {
    it('should put new item', function (done) {
      var id = uuid.v1();
      aws.putItem({ id: id, key1: 'value' })(function (err, res) {
        if (err) return done(err);

        dynamodb.getItem({
          TableName: process.env.AWS_DYNAMODB_TABLE,
          Key: { id: { "S": id } }
        }, function (err, data) {
          if (err) return done(err);
          data.Item.id.S.should.equal(id);
          data.Item.key1.S.should.equal('value');
          done();
        });
      });
    });

    it('should override item when id is already exists', function (done) {
      var id = uuid.v1();
      aws.putItem({ id: id, key1: 'value' })(function (err, res) {
        if (err) return done(err);

        aws.putItem({ id: id, key1: 'value1', key2: 'value2' })(function (err, res) {
          if (err) return done(err);

          dynamodb.getItem({
            TableName: process.env.AWS_DYNAMODB_TABLE,
            Key: { id: { "S": id } }
          }, function (err, data) {
            if (err) return done(err);
            data.Item.id.S.should.equal(id);
            data.Item.key1.S.should.equal('value1');
            data.Item.key2.S.should.equal('value2');
            done();
          });
        });
      });
    });

    it('should throw error when data.id is empty', function (done) {
      var id = uuid.v1();
      aws.putItem({ key: 'value' })(function (err, data) {
        if (err && err.message === 'One or more parameter values were invalid: Missing the key id in the item') {
          return done();
        }
        if (err) return done(err);
        done(new Error('ValidationException should throw.'));
      });
    });
  });

  describe('#getItem', function () {
    it('should return item specified by id', function (done) {
      var id = uuid.v1();
      dynamodb.putItem({
        TableName: process.env.AWS_DYNAMODB_TABLE,
        Item: { id: { "S": id }, key1: { "S": "value" } }
      }, function (err, res) {
        aws.getItem(id)(function (err, data) {
          if (err) return done(err);
          data.id.should.equal(id);
          data.key1.should.equal('value');
          done();
        });
      });
    });

    it('should return empty data if id is not exists', function (done) {
      var id = 'invalid';
      aws.getItem(id)(function (err, data) {
        if (err) return done(err);
        should.not.exists(data.id);
        Object.keys(data).should.have.length(0);
        done();
      });
    });
  });

  describe('#signedUploadUrl', function () {
    it('should return pre-signed putObject URL expired 60 seconds', function (done) {
      var opts = {
        id: 'test'
      };

      aws.signedUploadUrl(opts)(function (err, url) {
        if (err) return done(err);

        s3.getSignedUrl('putObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: 60,
          ContentType: 'binary/octet-stream'
        }, function (err, expected) {
          if (err) return done(err);
          url.should.equal(expected);
          done();
        });
      });
    });

    it('should return pre-signed putObject URL expired specified by arguments', function (done) {
      var opts = {
        id: 'test',
        expires: 120
      };

      aws.signedUploadUrl(opts)(function (err, url) {
        if (err) return done(err);

        s3.getSignedUrl('putObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: opts.expires,
          ContentType: 'binary/octet-stream'
        }, function (err, expected) {
          if (err) return done(err);
          url.should.equal(expected);
          done();
        });
      });
    });
  });

  describe('#signedDownloadUrl', function () {
    it('should return pre-signed getObject URL expired 30 seconds', function (done) {
      var opts = {
        id: 'test'
      };

      aws.signedDownloadUrl(opts)(function (err, url) {
        if (err) return done(err);

        s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: 30
        }, function (err, expected) {
          if (err) return done(err);
          url.should.equal(expected);
          done();
        });
      });
    });

    it('should return pre-signed getObject URL expired specified by arguments', function (done) {
      var opts = {
        id: 'test',
        expires: 120
      };

      aws.signedDownloadUrl(opts)(function (err, url) {
        if (err) return done(err);

        s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: opts.expires
        }, function (err, expected) {
          if (err) return done(err2);
          url.should.equal(expected);
          done();
        });
      });
    });
  });

  describe('#existsObject', function () {
    it('should return true if object exists in bucket', function (done) {
      var id = uuid.v1();
      s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: id,
        ContentType: 'binary/octet-stream',
        Body: 'test'
      }, function (err, res) {
        if (err) return done(err);

        aws.existsObject(id)(function (err, exist) {
          if (err) return done(err);
          exist.should.be.true;
          done();
        });
      });
    });

    it('should return false if object does not exists in bucket', function (done) {
      aws.existsObject('invalid')(function (err, exist) {
        if (err) return done(err);
        exist.should.be.false;
        done();
      });
    });
  });

  describe('#copyObject', function () {
    it('should only overwrite "ContentType" and "ContentDisposition" of current object', function (done) {
      var id = uuid.v1();
      s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: id,
        ContentType: 'text/plain',
        Body: 'test'
      }, function (err, res) {
        if (err) return done(err);

        var item = {
          id: id,
          filename: 'test.txt'
        };
        aws.copyObject(item)(function (err, res) {
          if (err) return done(err);

          s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: id
          }, function (err, data) {
            if (err) return done(err);

            data.ContentType.should.equal('binary/octet-stream');
            data.ContentDisposition.should.equal("attachment; filename*=UTF-8''test.txt");
            data.Body.toString().should.equal('test');
            done();
          });
        });
      });
    });
  });

});
