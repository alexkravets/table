'use strict'

const createSchema = require('./createSchema')

const createTable = (rawClient, tableName, primaryKey, indexes, options) => {
  const schema = createSchema(tableName, primaryKey, indexes, options)

  return rawClient.createTable(schema).promise()
}

module.exports = createTable
