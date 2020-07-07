'use strict'

const getSecondaryIndexes     = require('./getSecondaryIndexes')
const getAttributeDefinitions = require('./getAttributeDefinitions')

const createSchema = (TableName, primaryKey, indexes, options) => {
  const { partitionKey, sortKey } = primaryKey

  const KeySchema = [
    { KeyType: 'HASH',  AttributeName: partitionKey },
    { KeyType: 'RANGE', AttributeName: sortKey }
  ]

  const AttributeDefinitions = getAttributeDefinitions(partitionKey, sortKey, indexes)

  const { BillingMode, ...otherOptions } = options

  const schema = {
    TableName,
    KeySchema,
    BillingMode,
    AttributeDefinitions,
    ...otherOptions
  }

  const {
    LocalSecondaryIndexes,
    GlobalSecondaryIndexes
  } = getSecondaryIndexes(partitionKey, indexes, otherOptions)

  /* istanbul ignore else */
  if (LocalSecondaryIndexes) {
    schema.LocalSecondaryIndexes = LocalSecondaryIndexes
  }

  /* istanbul ignore else */
  if (GlobalSecondaryIndexes) {
    schema.GlobalSecondaryIndexes = GlobalSecondaryIndexes
  }

  return schema
}

module.exports = createSchema
