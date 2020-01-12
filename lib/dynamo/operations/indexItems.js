'use strict'

const querystring             = require('querystring')
const getQueryParameters      = require('../helpers/getQueryParameters')
const getProjectionExpression = require('../helpers/getProjectionExpression')

const request = async(client, tableName, parameters) => {
  try {
    return await client.query(parameters).promise()

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Table ${tableName} doesn't exists`)
    }

    throw error
  }
}

const getRequestParameters = (TableName, queryParameters, options) => {
  const parameters = { TableName, ...queryParameters }

  const { indexName, exclusiveStartKey, limit, sort, projection, ConsistentRead } = options

  parameters.ScanIndexForward = (!sort || sort === 'asc')

  if (indexName) {
    parameters.IndexName = indexName
  }

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

const indexItems = async(client, { tableName, partitionKey, sortKey }, query, options) => {
  const queryParameters = getQueryParameters(tableName, partitionKey, sortKey, query)
  const parameters      = getRequestParameters(tableName, queryParameters, options)

  const { limit } = options
  const hasLimit  = !!limit

  let items = []
  let count = 0
  let lastEvaluatedKey
  let isNextChunkRequired = true

  do {
    const { Items: chunk, LastEvaluatedKey } = await request(client, tableName, parameters)

    items = [ ...items, ...chunk ]
    count = items.length

    if (hasLimit && count > limit) {
      items = items.slice(0, limit)
      count = limit
    }

    lastEvaluatedKey    = LastEvaluatedKey
    isNextChunkRequired = (hasLimit && count < limit) && LastEvaluatedKey
    parameters.ExclusiveStartKey = LastEvaluatedKey

  } while (isNextChunkRequired)

  if (lastEvaluatedKey) {
    lastEvaluatedKey = querystring.stringify(lastEvaluatedKey)
  }

  return { items, count, lastEvaluatedKey }
}

module.exports = indexItems
