'use strict'

const querystring             = require('querystring')
const getConditionExpression  = require('./getConditionExpression')
const getProjectionExpression = require('./getProjectionExpression')

const buildQueryParameters = (queryKey, query, options) => {
  const parametersJson = JSON.stringify({ queryKey, query }, null, 2)

  const sortKeyValue      = query[queryKey.sortKey]
  const partitionKeyValue = query[queryKey.partitionKey]

  if (!partitionKeyValue) {
    throw new Error(`Query is missing partition key, ${parametersJson}`)
  }

  delete query[queryKey.partitionKey]

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression: FilterExpression } = getConditionExpression(query, queryKey.sortKey)

  const parameters = {
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  if (FilterExpression) {
    parameters.FilterExpression = FilterExpression
  }

  const { tableName, sortKey, partitionKey, indexName } = queryKey

  parameters.KeyConditionExpression = `#${partitionKey} = :${partitionKey}`
  parameters.ExpressionAttributeNames[`#${partitionKey}`]  = partitionKey
  parameters.ExpressionAttributeValues[`:${partitionKey}`] = partitionKeyValue

  // TODO: Sort key may support other comparison options:
  //       https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
  if (sortKeyValue) {
    parameters.KeyConditionExpression += ` AND #${sortKey} = :${sortKey}`
    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}`] = sortKeyValue
  }

  if (indexName) {
    parameters.IndexName = indexName
  }

  parameters.TableName = tableName

  const { exclusiveStartKey, limit, sort, projection, ConsistentRead } = options

  parameters.ScanIndexForward = (!sort || sort === 'asc')

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
  }

  if (ConsistentRead) {
    parameters.ConsistentRead = true
  }

  if (projection) {
    const {
      ProjectionExpression,
      ExpressionAttributeNames
    } = getProjectionExpression(projection)

    parameters.ProjectionExpression = ProjectionExpression
    parameters.ExpressionAttributeNames = {
      ...parameters.ExpressionAttributeNames,
      ...ExpressionAttributeNames
    }
  }

  return parameters
}

module.exports = buildQueryParameters
