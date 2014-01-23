#!/bin/sh
source ./scripts/.env

node_modules/forever/bin/forever \
  -w \
  -c 'node --harmony' \
  -l logs/forever.log \
  -o logs/out.log \
  -e logs/error.log \
  --watchIgnore *.log \
  app.js
