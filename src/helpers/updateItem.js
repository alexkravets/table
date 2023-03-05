'use strict'

const createError              = require('./createError')
const buildUpdateExpression    = require('./buildUpdateExpression')
const buildConditionExpression = require('./buildConditionExpression')

const updateItem = async (client, TableName, Key, conditionQuery, attributes) => {
  let parameters = {
    Key,
    TableName,
    ReturnValues: 'ALL_NEW',
    ...buildConditionExpression(conditionQuery)
  }

  parameters = buildUpdateExpression(parameters, attributes)

  let result

  try {
    result = await client.update(parameters)

  } catch (dynamoError) {
    if (dynamoError.name === 'ConditionalCheckFailedException') {
      return false
    }

    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (dynamoError.name === 'ResourceNotFoundException') {
      throw createError(`Table "${TableName}" does not exist`)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return result.Attributes
}

module.exports = updateItem
