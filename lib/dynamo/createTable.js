'use strict'

const uniq = require('lodash.uniq')

const getTableIndexes = indexes => {
  const globalSecondaryIndexes = []

  for (const IndexName in indexes) {
    const { primaryKey, sortKey } = indexes[IndexName]

    const KeySchema = [{
      AttributeName: primaryKey,
      KeyType:       'HASH'
    }]

    if (sortKey) {
      KeySchema.push({
        AttributeName: sortKey,
        KeyType:       'RANGE'
      })
    }

    globalSecondaryIndexes.push({
      IndexName,
      KeySchema,
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits:  1,
        WriteCapacityUnits: 1
      }
    })
  }

  return globalSecondaryIndexes
}

const getAttributeDefinitions = indexes => {
  const AttributeDefinitions = []

  let attributes = [ 'id' ]
  for (const indexName in indexes) {
    const { primaryKey, sortKey } = indexes[indexName]
    attributes.push(primaryKey)

    if (sortKey) {
      attributes.push(sortKey)
    }
  }
  attributes = uniq(attributes)

  for (const AttributeName of attributes) {
    AttributeDefinitions.push({ AttributeName, AttributeType: 'S' })
  }

  return AttributeDefinitions
}

const getTableSchema = (TableName, indexes) => {
  const KeySchema = [{
    AttributeName: 'id',
    KeyType:       'HASH'
  }]

  const GlobalSecondaryIndexes = getTableIndexes(indexes)
  const AttributeDefinitions   = getAttributeDefinitions(indexes)

  return {
    TableName,
    KeySchema,
    AttributeDefinitions,
    GlobalSecondaryIndexes,
    ProvisionedThroughput: {
      ReadCapacityUnits:  1,
      WriteCapacityUnits: 1
    }
  }
}

const createTable = async(rawClient, TableName, indexes) => {
  const tableSchema = getTableSchema(TableName, indexes)
  try {
    await rawClient.createTable(tableSchema).promise()

  } catch (error) {
    if (error.code !== 'ResourceInUseException') {
      throw error
    }
  }
}

module.exports = createTable
