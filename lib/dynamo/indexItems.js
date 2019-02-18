'use strict'

const querystring = require('querystring')
const { getProjectionExpression, getConditionExpression } = require('./helpers')

const request = async(client, TableName, parameters) => {
  try {
    return await client.query(parameters).promise()

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }
}

const getRequestParameters = (TableName, queryParameters, options) => {
  const parameters = { TableName, ...queryParameters }

  const { indexName, exclusiveStartKey, limit, sort, projection } = options

  parameters.ScanIndexForward = (sort === 'asc')

  if (indexName) {
    parameters.IndexName = indexName
  }

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
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

const getQueryParameters = ({ partitionKey, value }, query) => {
  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression } = getConditionExpression(query)

  const parameters = { ExpressionAttributeNames, ExpressionAttributeValues }

  if (ConditionExpression) {
    parameters.FilterExpression = ConditionExpression
  }

  parameters.KeyConditionExpression = `#${partitionKey} = :${partitionKey}`
  parameters.ExpressionAttributeNames[`#${partitionKey}`]  = partitionKey
  parameters.ExpressionAttributeValues[`:${partitionKey}`] = value

  return parameters
}

const indexItems = async(
  client,
  TableName,
  { partitionKey },
  indexes,
  query,
  options) => {

  let { indexName: IndexName } = options

  if (IndexName) {
    const config = indexes[IndexName]

    if (!config) {
      throw new Error(`Index "${IndexName}" is not defined for table "${TableName}".`)
    }

    partitionKey = config.partitionKey || partitionKey
  }

  const partitionKeyValue = query[partitionKey]

  if (!partitionKeyValue) {
    const parametersJson = JSON.stringify({
      TableName,
      partitionKey,
      query
    }, null, 2)

    throw new Error(`Query is missing partition key, ${parametersJson}`)
  }

  delete query[partitionKey]

  const partition       = { partitionKey, value: partitionKeyValue }
  const queryParameters = getQueryParameters(partition, query)
  const parameters      = getRequestParameters(TableName, queryParameters, options)

  const { limit } = options
  const hasLimit  = !!limit

  let items = []
  let count = 0
  let lastEvaluatedKey
  let isNextChunkRequired = true

  do {
    const { Items: chunk, LastEvaluatedKey } = await request(client, TableName, parameters)

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
