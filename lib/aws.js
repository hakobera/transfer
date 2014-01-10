var AWS = require('aws-sdk');
var crypto = require('crypto');
var util = require('util');
var mime = require('mime');

AWS.config.update({ region: process.env.AWS_REGION || 'us-west-1' });

var dynamodb = new AWS.DynamoDB();
var tableName = process.env.AWS_DYNAMODB_TABLE;

var s3 = new AWS.S3();
var bucketName = process.env.AWS_S3_BUCKET;

function pack(values) {
  var item = {};
  for (var key in values) {
    item[key] = { "S": values[key] };
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
        Expires: options.expires || 60 * 60 /*sec*/,
        ContentType: options.contentType || mime.lookup(options.filename)
      };
      s3.getSignedUrl('putObject', params, fn);
    };
  },

  signedDownloadUrl: function (options) {
    return function (fn) {
      var params = {
        Bucket: bucketName,
        Key: options.id
      };
      s3.getSignedUrl('getObject', params, fn);
    };
  }
};
