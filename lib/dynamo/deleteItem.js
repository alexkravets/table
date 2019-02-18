'use strict'

const ResourceNotFoundError = require('../errors/ResourceNotFoundError')
const { getConditionExpression, getPrimaryKey } = require('./helpers')

const deleteItem = async(
  client,
  TableName,
  { partitionKey, sortKey },
  query) => {

  const Key = getPrimaryKey(TableName, partitionKey, sortKey, query)
  delete query[partitionKey]

  let {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression
  } = getConditionExpression(query)

  const parameters = {
    Key,
    TableName,
    ConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  try {
    await client.delete(parameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError({ ...Key, ...query })
    }

    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw error
  }
}

module.exports = deleteItem
