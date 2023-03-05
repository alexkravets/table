'use strict'

const createError = require('./createError')

const createItem = async (client, TableName, primaryKey, attributes) => {
  const { sortKey: idKey } = primaryKey

  const putParameters = {
    TableName,
    Item:                      attributes,
    ConditionExpression:       `#${idKey} <> :${idKey}`,
    ExpressionAttributeNames:  {},
    ExpressionAttributeValues: {}
  }

  putParameters.ExpressionAttributeNames[`#${idKey}`]  = idKey
  putParameters.ExpressionAttributeValues[`:${idKey}`] = attributes[idKey]

  try {
    await client.put(putParameters)

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

module.exports = createItem
