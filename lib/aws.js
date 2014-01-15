var AWS = require('aws-sdk');
var crypto = require('crypto');
var util = require('util');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  sslEnabled: true
});

var dynamodb = new AWS.DynamoDB();
var tableName = process.env.AWS_DYNAMODB_TABLE;

var s3 = new AWS.S3();
var bucketName = process.env.AWS_S3_BUCKET;

function pack(values) {
  var item = {};
  for (var key in values) {
    if (values[key]) {
      item[key] = { "S": values[key] };
    }
  }
  return item;
}

function unpack(items) {
  var values = {};
  for (var key in items) {
    values[key] = items[key]["S"];
  }
  return values;
}

module.exports = {
  putItem: function (values) {
    return function (fn) {
      dynamodb.putItem({
        TableName: tableName,
        Item: pack(values)
      }, fn);
    };
  },

  getItem: function (id) {
    return function (fn) {
      dynamodb.getItem({
        TableName: tableName,
        Key: pack({ id: id })
      }, function (err, data) {
        if (err) return fn(err);
        fn(null, unpack(data.Item));
      });
    };
  },

  signedUploadUrl: function (options) {
    return function (fn) {
      var params = {
        Bucket: bucketName,
        Key: options.id,
        Expires: options.expires || 86400/*sec == 24 * 60 * 60 sec == 1 day*/,
        ContentType: 'binary/octet-stream'
      };
      s3.getSignedUrl('putObject', params, fn);
    };
  },

  signedDownloadUrl: function (options) {
    return function (fn) {
      var params = {
        Bucket: bucketName,
        Key: options.id,
        Expires: 30/*sec*/,
      };
      s3.getSignedUrl('getObject', params, fn);
    };
  },

  existsObject: function (id) {
    return function (fn) {
      var params = {
        Bucket: bucketName,
        Key: id
      };
      s3.headObject(params, function (err, response) {
        if (err) {
          if (err.statusCode && err.statusCode === 404) {
            return fn(null, false);
          } else {
            return fn(err);
          }
        }
        fn(null, true);
      });
    };
  },

  copyObject: function (item) {
    return function (fn) {
      var params = {
        Bucket: bucketName,
        Key: item.id,
        CopySource: encodeURIComponent(util.format('%s/%s', bucketName, item.id)),
        ContentType: 'binary/octet-stream',
        ContentDisposition: util.format("attachment; filename*=UTF-8''%s", encodeURIComponent(item.filename)),
        MetadataDirective: 'REPLACE'
      };
      s3.copyObject(params, fn);
    };
  }
};
