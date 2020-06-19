'use strict'

const createSchema = require('./createSchema')

const createTable = (rawClient, primaryKey, indexes, options) => {
  const schema = createSchema(primaryKey, indexes, options)

  return rawClient.createTable(schema).promise()
}

module.exports = createTable
