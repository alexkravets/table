'use strict'

const createSchema = require('./createSchema')
const {CreateTableCommand} = require('@aws-sdk/client-dynamodb')

const createTable = (client, tableName, primaryKey, indexes, options) => {
  const schema = createSchema(tableName, primaryKey, indexes, options)
  const command = new CreateTableCommand(schema)
  return client.send(command)
}

module.exports = createTable
