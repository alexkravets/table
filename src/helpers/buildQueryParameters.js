'use strict'

const omit                      = require('lodash.omit')
const querystring               = require('querystring')
const buildConditionExpression  = require('./buildConditionExpression')
const buildProjectionExpression = require('./buildProjectionExpression')

const buildQueryParameters = (TableName, indexKey, query, options) => {
  const { sortKey, partitionKey } = indexKey

  const sortKeyValue      = query[sortKey]
  const partitionKeyValue = query[partitionKey]

  const queryCondintions = omit(query, [ partitionKey ])

  const { indexName } = options

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression: FilterExpression } = buildConditionExpression(queryCondintions, sortKey)

  const parameters = {
    TableName,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  if (indexName) {
    parameters.IndexName = indexName
  }

  if (FilterExpression) {
    parameters.FilterExpression = FilterExpression
  }

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

  const { exclusiveStartKey, limit, sort, projection, consistentRead } = options

  parameters.ScanIndexForward = (!sort || sort === 'asc')

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
  }

  parameters.ConsistentRead = consistentRead ? consistentRead : false

  if (projection) {
    const {
      ProjectionExpression,
      ExpressionAttributeNames
    } = buildProjectionExpression(projection)

    parameters.ProjectionExpression = ProjectionExpression
    parameters.ExpressionAttributeNames = {
      ...parameters.ExpressionAttributeNames,
      ...ExpressionAttributeNames
    }
  }

  return parameters
}

module.exports = buildQueryParameters
