'use strict'

const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const deleteItem = async(client, resourceName, TableName, id) => {
  const Key = { id }
  const ConditionExpression       = 'id = :id'
  const ExpressionAttributeValues = { ':id': id }

  const parameters = {
    Key,
    TableName,
    ConditionExpression,
    ExpressionAttributeValues
  }

  try {
    await client.delete(parameters).promise()

  } catch (error) {
    if (error.code == 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError(resourceName, ConditionExpression)
    }

    if (error.code == 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }
}

module.exports = deleteItem
