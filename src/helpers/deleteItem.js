'use strict'

const createError = require('./createError')
const buildConditionExpression = require('./buildConditionExpression')

const deleteItem = async (client, TableName, Key, conditionQuery) => {
  let parameters = { Key, TableName }

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression
  } = buildConditionExpression(conditionQuery)

  parameters = {
    ...parameters,
    ConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  try {
    await client.delete(parameters)

  } catch (dynamoError) {
    if (dynamoError.name === 'ConditionalCheckFailedException') {
      return false
    }

    /* istanbul ignore else */
    if (dynamoError.name === 'ResourceNotFoundException') {
      throw createError(`Table "${TableName}" does not exist`)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return true
}

module.exports = deleteItem
