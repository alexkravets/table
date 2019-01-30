'use strict'

const uniq   = require('lodash.uniq')
const config = require('config')

const isProvisionedThroughputDefined = config.has('dynamodb.ProvisionedThroughput')

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

    const globalSecondaryIndex = {
      IndexName,
      KeySchema,
      Projection: {
        ProjectionType: 'ALL'
      }
    }

    if (isProvisionedThroughputDefined) {
      globalSecondaryIndex.ProvisionedThroughput =
        config.get('dynamodb.ProvisionedThroughput')
    }

    globalSecondaryIndexes.push(globalSecondaryIndex)
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

  const schema = {
    TableName,
    KeySchema,
    AttributeDefinitions,
    GlobalSecondaryIndexes
  }

  if (isProvisionedThroughputDefined) {
    schema.ProvisionedThroughput =
      config.get('dynamodb.ProvisionedThroughput')

  } else {
    schema.BillingMode = 'PAY_PER_REQUEST'

  }

  return schema
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
