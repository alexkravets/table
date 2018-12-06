'use strict'

const fs      = require('fs')
const get     = require('lodash.get')
const config  = require('config')
const homedir = require('os').homedir()

const credentialsPath = `${homedir}/.aws/credentials`
const hasCredentials  = fs.existsSync(credentialsPath)

const stage   = config.get('provider.stage')
const region  = config.get('provider.region')
const service = config.get('service')

const endpoint = get(config, 'dynamodb.endpoint')

module.exports = () => {
  const AWS = require('aws-sdk')
  const options = { region, endpoint }

  if (hasCredentials) {
    const profile = config.get('provider.profile')
    options.credentials = new AWS.SharedIniFileCredentials({ profile })
  }

  const tablePrefix = `${service}-${stage}`

  return { AWS, options, tablePrefix }
}
