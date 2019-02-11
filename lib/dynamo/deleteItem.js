'use strict'

const ResourceNotFoundError      = require('../errors/ResourceNotFoundError')
const { getConditionExpression } = require('./helpers')

const deleteItem = async(client, resourceName, TableName, query) => {
  const Key = { id: query.id }

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
      throw new ResourceNotFoundError(resourceName, query)
    }

    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }
}

module.exports = deleteItem
