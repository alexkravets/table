'use strict'

const getSecondaryIndexes     = require('./getSecondaryIndexes')
const getAttributeDefinitions = require('./getAttributeDefinitions')

const createSchema = ({ tableName: TableName, partitionKey, sortKey }, indexes, options) => {
  const KeySchema = [
    { KeyType: 'HASH',  AttributeName: partitionKey },
    { KeyType: 'RANGE', AttributeName: sortKey }
  ]

  const AttributeDefinitions = getAttributeDefinitions(partitionKey, sortKey, indexes)

  const schema = {
    TableName,
    KeySchema,
    AttributeDefinitions,
    ...options
  }

  const {
    LocalSecondaryIndexes,
    GlobalSecondaryIndexes
  } = getSecondaryIndexes(partitionKey, indexes, options)

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
