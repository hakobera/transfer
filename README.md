# Transfer [![Build Status](https://travis-ci.org/hakobera/transfer.png?branch=master)](https://travis-ci.org/hakobera/transfer)

Transfer is a simple file sharing service.

## How to run on your local machine

### Install Node.js 0.11.9 or higher.

This app is build by [Koa](https://github.com/koajs/koa).
Koa use generator so, this app must be running Node.js 0.11.9 or higher.

### Create Amazon Web Service account

This app use Amazon S3 and Amazon DynamoDB.
So you must create AWS account and get you own access key.

### Create Amazon S3 bucket for store files

Create S3 buckect for store uploaded file.
You can use any buckect name if you want.

### Create Amazon DynamoDB table for store file meta data

Create DynamoDB a table for store file meta data.
You can use any table name if you want, but `Primary Key` must be following settings.

- Primary Key Type: `Hash`
- Hash Attribute Type: `String`
- Hash Attribute Name: `id`

### Clone this repository

```
$ git clone git@github.com:hakobera/transfer.git
$ cd transfer
$ npm install
```

### Edit scripte/.env

Copy `scripts/.env.template` to 'scripts/.env'.

```
$ cp scripts/.env.template scripts/.env
```

Then edit to fill in environment value.
Prefix `AWS_` is required value and others are optional.

```
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_REGION=
export AWS_S3_BUCKET=
export AWS_DYNAMODB_TABLE=
# If you want to test mail feature, set followings.
#export MAIL_FROM=
#export MAILGUN_SMTP_LOGIN=
#export MAILGUN_SMTP_PASSWORD=
```

### Run app

```
$ ./scripts/dev.sh
```

## How to run on Heroku

### Create heroku app

```
$ heroku create [your-app-name]
```

### Add addons

```
$ heroku addons:add mailgun
$ heroku addons:add sentry          # optional
$ heroku addons:add newrelic:stark  # optional
$ heroku addons:add papertrail      # optional
```

Above setup is only use free/development add-on plans.
You should upgrade the plan of each add-on if you want.
You can show which plan is avaiable in following pages.

- [Mailgun | Add-ons | Heroku](https://addons.heroku.com/mailgun)
- [Sentry | Add-ons | Heroku](https://addons.heroku.com/sentry)
- [New Relic](https://addons.heroku.com/newrelic)
- [Papertrail](https://addons.heroku.com/papertrail)

### Set config variables

```
$ heroku config:set \
    NODE_ENV=production \
    MAIL_FROM=[your-email-address] \
    HOST="https://[your-app-name].herokuapp.com" \
    AWS_ACCESS_KEY_ID=[your-aws-access-key] \
    AWS_SECRET_ACCESS_KEY=[your-aws-secret-access-key] \
    AWS_REGION=[your-aws-region such as 'us-east-1', 'ap-northeast-1'] \
    AWS_DYNAMODB_TABLE=[your-aws-dynamodb-table-name-for-transfer] \
    AWS_S3_BUCKET=[your-aws-s3-bucket-name-for-transfor] \
    -a [your-app-name]
```
