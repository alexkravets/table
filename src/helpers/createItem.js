'use strict'

const TableNotFoundError = require('../errors/TableNotFoundError')

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
    await client.put(putParameters).promise()

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

module.exports = createItem
