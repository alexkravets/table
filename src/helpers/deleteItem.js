'use strict'

const TableNotFoundError = require('../errors/TableNotFoundError')
const buildConditionExpression = require('./buildConditionExpression')

const deleteItem = async (client, TableName, Key, attributes) => {
  let {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression
  } = buildConditionExpression(attributes)

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
      throw new TableNotFoundError(TableName)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return true
}

module.exports = deleteItem
