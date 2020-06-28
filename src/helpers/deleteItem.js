'use strict'

const createError = require('./createError')
const buildConditionExpression = require('./buildConditionExpression')

const deleteItem = async (client, TableName, Key, query) => {
  let {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression
  } = buildConditionExpression(query)

  const parameters = {
    Key,
    TableName,
    ConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  try {
    await client.delete(parameters).promise()

  } catch (dynamoError) {
    if (dynamoError.code === 'ConditionalCheckFailedException') {
      return false
    }

    /* istanbul ignore else */
    if (dynamoError.code === 'ResourceNotFoundException') {
      throw createError(`Table "${TableName}" does not exist`)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return true
}

module.exports = deleteItem
