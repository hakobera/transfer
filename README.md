# Transfer

Transfer is a simple file sharing service.

## How to run on Heroku

### Create heroku app

```
$ heroku create [your-app-name]
```

### Add addons

```
$ heroku addons:add mailgun
$ heroku addons:add sentry
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
