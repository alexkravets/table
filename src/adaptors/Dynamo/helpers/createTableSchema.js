'use strict'

const uniq   = require('lodash.uniq')
const config = require('config')

const isProvisionedThroughputDefined = config.has('dynamodb.ProvisionedThroughput')

const buildSecondaryIndexes = (indexes, isGlobal = false) => {
  const secondaryIndexes = []

  for (const IndexName in indexes) {
    const { partitionKey, sortKey } = indexes[IndexName]

    const KeySchema = [{
      AttributeName: partitionKey,
      KeyType:       'HASH'
    }]

    if (sortKey) {
      KeySchema.push({
        AttributeName: sortKey,
        KeyType:       'RANGE'
      })
    }

    const secondaryIndex = {
      IndexName,
      KeySchema,
      Projection: {
        // TODO: This should be configurable as well:
        ProjectionType: 'ALL'
      }
    }

    if (isGlobal && isProvisionedThroughputDefined) {
      secondaryIndex.ProvisionedThroughput =
        config.get('dynamodb.ProvisionedThroughput')
    }

    secondaryIndexes.push(secondaryIndex)
  }

  return secondaryIndexes
}

const getSecondaryIndexes = (partitionKey, indexes) => {
  const localIndexes  = {}
  const globalIndexes = {}

  for (const indexName in indexes) {
    const hasPartitionKey = !!indexes[indexName].partitionKey

    if (hasPartitionKey) {
      globalIndexes[indexName] = indexes[indexName]

    } else {
      localIndexes[indexName] = { partitionKey, ...indexes[indexName] }

    }
  }

  const LocalSecondaryIndexes  = buildSecondaryIndexes(localIndexes)
  const GlobalSecondaryIndexes = buildSecondaryIndexes(globalIndexes, true)

  return { LocalSecondaryIndexes, GlobalSecondaryIndexes }
}

const getAttributeDefinitions = (partitionKey, sortKey, indexes) => {
  const AttributeDefinitions = []

  let attributes = [ partitionKey, sortKey ]
  for (const indexName in indexes) {
    const { partitionKey, sortKey } = indexes[indexName]

    if (partitionKey) {
      attributes.push(partitionKey)
    }

    if (sortKey) {
      attributes.push(sortKey)
    }
  }
  attributes = uniq(attributes)

  for (const AttributeName of attributes) {
    // TODO: This should be based on schema.
    AttributeDefinitions.push({ AttributeName, AttributeType: 'S' })
  }

  return AttributeDefinitions
}

const createTableSchema = ({ tableName: TableName, partitionKey, sortKey }, indexes) => {
  const KeySchema = [{
    AttributeName: partitionKey,
    KeyType:       'HASH'
  },
  {
    AttributeName: sortKey,
    KeyType:       'RANGE'
  }]

  const AttributeDefinitions = getAttributeDefinitions(partitionKey, sortKey, indexes)

  const schema = {
    TableName,
    KeySchema,
    AttributeDefinitions
  }

  const { GlobalSecondaryIndexes, LocalSecondaryIndexes } = getSecondaryIndexes(partitionKey, indexes)
  const hasLocalSecondaryIndexes  = LocalSecondaryIndexes.length > 0
  const hasGlobalSecondaryIndexes = GlobalSecondaryIndexes.length > 0

  if (hasLocalSecondaryIndexes) {
    schema.LocalSecondaryIndexes = LocalSecondaryIndexes
  }

  if (hasGlobalSecondaryIndexes) {
    schema.GlobalSecondaryIndexes = GlobalSecondaryIndexes
  }

  /* istanbul ignore else: PAY_PER_REQUEST is available in AWS environment only */
  if (isProvisionedThroughputDefined) {
    schema.ProvisionedThroughput =
      config.get('dynamodb.ProvisionedThroughput')

  } else {
    schema.BillingMode = 'PAY_PER_REQUEST'

  }

  return schema
}

module.exports = createTableSchema
