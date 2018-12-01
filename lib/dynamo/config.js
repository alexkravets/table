'use strict'

const fs      = require('fs')
const config  = require('config')
const homedir = require('os').homedir()

const credentialsPath = `${homedir}/.aws/credentials`
const hasCredentials  = fs.existsSync(credentialsPath)

module.exports = () => {
  const AWS = require('aws-sdk')

  const region  = config.get('provider.region')
  const isLocal = config.get('dynamodb.isLocal')

  const options = { region }

  if (hasCredentials) {
    const profile = config.get('provider.profile')
    options.credentials = new AWS.SharedIniFileCredentials({ profile })
  }

  if (isLocal) {
    options.endpoint = 'http://0.0.0.0:8000'
  }

  const stage       = config.get('provider.stage')
  const service     = config.get('service')
  const tablePrefix = `${service}-${stage}`

  return { AWS, options, tablePrefix }
}
