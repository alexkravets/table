'use strict'

const fs       = require('fs')
const get      = require('lodash.get')
const pickBy   = require('lodash.pickby')
const config   = require('config')
const homedir  = require('os').homedir()
const identity = require('lodash.identity')

const credentialsPath = `${homedir}/.aws/credentials`
const hasCredentials  = fs.existsSync(credentialsPath)

const stage   = config.get('provider.stage')
const region  = config.get('provider.region')
const service = config.get('service')

const endpoint = get(config, 'dynamodb.endpoint')

module.exports = () => {
  const AWS     = require('aws-sdk')
  const options = pickBy({ region, endpoint }, identity)

  /* istanbul ignore else: Credentials are not used in AWS environment */
  if (hasCredentials) {
    const profile = config.get('provider.profile')
    options.credentials = new AWS.SharedIniFileCredentials({ profile })
  }

  const tablePrefix = `${service}-${stage}`

  return { AWS, options, tablePrefix }
}
