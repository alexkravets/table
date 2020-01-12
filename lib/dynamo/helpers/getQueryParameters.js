'use strict'

const getConditionExpression = require('./getConditionExpression')

const getQueryParameters = (tableName, partitionKey, sortKey, query) => {
  const sortKeyValue      = query[sortKey]
  const partitionKeyValue = query[partitionKey]

  if (!partitionKeyValue) {
    const parametersJson = JSON.stringify({
      tableName,
      partitionKey,
      query
    }, null, 2)

    throw new Error(`Query is missing partition key, ${parametersJson}`)
  }

  delete query[partitionKey]

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression: FilterExpression } = getConditionExpression(query, sortKey)

  const parameters = { ExpressionAttributeNames, ExpressionAttributeValues }

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

  return parameters
}

module.exports = getQueryParameters
