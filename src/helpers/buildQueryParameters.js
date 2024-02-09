'use strict'

const querystring               = require('querystring')
const buildConditionExpression  = require('./buildConditionExpression')
const buildProjectionExpression = require('./buildProjectionExpression')
const _extendKeyConditionExpressionParameters = require('./_extendKeyConditionExpressionParameters')

const buildQueryParameters = (TableName, indexKey, query, options) => {
  const { sortKey, partitionKey } = indexKey

  const {
    [sortKey]:         sortKeyValue,
    [`${sortKey}:bw`]: sortKeyBeginsWithValue,
    [`${sortKey}:lt`]: sortKeyLowerThanValue,
    [`${sortKey}:gt`]: sortKeyGreaterThanValue,
    [partitionKey]:    partitionKeyValue,
    ...conditionQuery
  } = query

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression: FilterExpression } = buildConditionExpression(conditionQuery)

  const parameters = {
    TableName,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  const {
    sort,
    limit,
    indexName,
    projection,
    consistentRead = false,
    exclusiveStartKey
  } = options

  if (indexName) {
    parameters.IndexName = indexName
  }

  if (FilterExpression) {
    parameters.FilterExpression = FilterExpression
  }

  parameters.ScanIndexForward = (!sort || sort === 'asc')

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
  }

  parameters.ConsistentRead = consistentRead

  parameters.KeyConditionExpression = `#${partitionKey} = :${partitionKey}`
  parameters.ExpressionAttributeNames[`#${partitionKey}`]  = partitionKey
  parameters.ExpressionAttributeValues[`:${partitionKey}`] = partitionKeyValue

  _extendKeyConditionExpressionParameters(parameters, sortKey, {
    sortKeyValue,
    sortKeyBeginsWithValue,
    sortKeyLowerThanValue,
    sortKeyGreaterThanValue,
  })

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
