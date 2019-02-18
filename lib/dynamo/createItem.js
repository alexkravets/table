'use strict'

const ResourceExistsError = require('../errors/ResourceExistsError')

const createItem = async(client, resourceName, idKey, TableName, Item) => {
  const idValue = Item[idKey]

  const parameters = {
    Item,
    TableName,
    ConditionExpression:       `#${idKey} <> :${idKey}`,
    ExpressionAttributeNames:  {},
    ExpressionAttributeValues: {}
  }

  parameters.ExpressionAttributeNames[`#${idKey}`]  = idKey
  parameters.ExpressionAttributeValues[`:${idKey}`] = idValue

  try {
    await client.put(parameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceExistsError(resourceName, idValue)
    }

    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }
}

module.exports = createItem
