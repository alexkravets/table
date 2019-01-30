'use strict'

const ResourceExistsError = require('../errors/ResourceExistsError')

const createItem = async(client, resourceName, TableName, Item) => {
  const { id } = Item

  const parameters = {
    Item,
    TableName,
    ConditionExpression:       '#id <> :id',
    ExpressionAttributeNames:  { '#id': 'id' },
    ExpressionAttributeValues: { ':id': id }
  }

  try {
    await client.put(parameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceExistsError(resourceName, id)
    }

    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }
}

module.exports = createItem
