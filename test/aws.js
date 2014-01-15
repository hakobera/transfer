var aws = require('../lib/aws');
var should = require('should');
var sinon = require('sinon');
var co = require('co');
var uuid = require('node-uuid');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var s3 = new AWS.S3();

var getItem = function (params) {
  return function (fn) { dynamodb.getItem(params, fn); }
};

var putItem = function (params) {
  return function (fn) { dynamodb.putItem(params, fn); }
};

var getSignedUrl = function (method, params) {
  return function (fn) { s3.getSignedUrl(method, params, fn); }
};

var headObject = function (params) {
  return function (fn) { s3.headObject(params, fn); }
};

var putObject = function (params) {
  return function (fn) { s3.putObject(params, fn); }
};

var getObject = function (params) {
  return function (fn) { s3.getObject(params, fn); }
}

describe('aws', function () {
  this.timeout(10000);

  describe('#putItem', function () {
    it('should put new item', function (done) {
      co(function* () {
        var id = uuid.v1();
        var item = { id: id, key1: 'value' };

        yield aws.putItem(item);

        var data = yield getItem({
          TableName: process.env.AWS_DYNAMODB_TABLE,
          Key: { id: { "S": id } }
        });

        data.Item.id.S.should.equal(item.id);
        data.Item.key1.S.should.equal(item.key1);
      })(done);
    });

    it('should override item when id is already exists', function (done) {
      co(function* () {
        var id = uuid.v1();
        var item = { id: id, key1: 'value' };
        var newItem = { id: id, key1: 'value1', key2: 'value2' };

        yield aws.putItem(item);
        yield aws.putItem(newItem);

        var data = yield getItem({
          TableName: process.env.AWS_DYNAMODB_TABLE,
          Key: { id: { "S": id } }
        });

        data.Item.id.S.should.equal(newItem.id);
        data.Item.key1.S.should.equal(newItem.key1);
        data.Item.key2.S.should.equal(newItem.key2);
      })(done);
    });

    it('should throw error when data.id is empty', function (done) {
      co(function* () {
        var id = uuid.v1();
        var item = { key: 'value' };

        try {
          yield aws.putItem(item);
        } catch (err) {
          if (err && err.message === 'One or more parameter values were invalid: Missing the key id in the item') {
            return;
          }
          throw err;
        }
      })(done);
    });
  });

  describe('#getItem', function () {
    it('should return item specified by id', function (done) {
      co(function* () {
        var id = uuid.v1();
        yield putItem({
          TableName: process.env.AWS_DYNAMODB_TABLE,
          Item: { id: { "S": id }, key1: { "S": "value" } }
        });

        var data = yield aws.getItem(id);
        data.id.should.equal(id);
        data.key1.should.equal('value');
      })(done);
    });

    it('should return empty data if id is not exists', function (done) {
      co(function* () {
        var id = 'invalid';
        var data = yield aws.getItem(id);
        should.not.exists(data.id);
        Object.keys(data).should.have.length(0);
      })(done);
    });
  });

  describe('#signedUploadUrl', function () {
    it('should return pre-signed putObject URL expired after 1 day', function (done) {
      co(function* () {
        var opts = { id: 'test' };
        var url = yield aws.signedUploadUrl(opts);
        var expected = yield getSignedUrl('putObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: 86400,
          ContentType: 'binary/octet-stream'
        });
        url.should.equal(expected);
      })(done);
    });

    it('should return pre-signed putObject URL expired after specified by arguments', function (done) {
      co(function* () {
        var opts = {
          id: 'test',
          expires: 120
        };
        var url = yield aws.signedUploadUrl(opts);
        var expected = yield getSignedUrl('putObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: opts.expires,
          ContentType: 'binary/octet-stream'
        });
        url.should.equal(expected);
      })(done);
    });
  });

  describe('#signedDownloadUrl', function () {
    it('should return pre-signed getObject URL expired after 30 seconds', function (done) {
      co(function* () {
        var opts = {
          id: 'test'
        };
        var url = yield aws.signedDownloadUrl(opts);
        var expected = yield getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: 30
        });
        url.should.equal(expected);
      })(done);
    });

    it('should return pre-signed getObject URL expired after specified by arguments', function (done) {
      co(function* () {
        var opts = {
          id: 'test',
          expires: 120
        };
        var url = yield aws.signedDownloadUrl(opts);
        var expected = yield getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: opts.id,
          Expires: opts.expires
        });
        url.should.equal(expected);
      })(done);
    });
  });

  describe('#existsObject', function () {
    it('should return true if object exists in bucket', function (done) {
      co(function *() {
        var id = uuid.v1();
        yield putObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: id,
          ContentType: 'binary/octet-stream',
          Body: 'test'
        });
        var exist = yield aws.existsObject(id);
        exist.should.be.true;
      })(done);
    });

    it('should return false if object does not exists in bucket', function (done) {
      co(function* () {
        var exist = yield aws.existsObject('invalid');
        exist.should.be.false;
      })(done);
    });
  });

  describe('#copyObject', function () {
    it('should only overwrite "ContentType" and "ContentDisposition" of current object', function (done) {
      co(function* () {
        var id = uuid.v1();

        yield putObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: id,
          ContentType: 'text/plain',
          Body: 'test'
        });

        var item = {
          id: id,
          filename: 'test.txt'
        };

        yield aws.copyObject(item);

        var data = yield getObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: id
        });

        data.ContentType.should.equal('binary/octet-stream');
        data.ContentDisposition.should.equal("attachment; filename*=UTF-8''test.txt");
        data.Body.toString().should.equal('test');
      })(done);
    });
  });

});
