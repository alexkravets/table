'use strict'

const ResourceExistsError     = require('../../../errors/ResourceExistsError')
const InvalidAttributesError  = require('../../../errors/InvalidAttributesError')
const CollectionNotFoundError = require('../../../errors/CollectionNotFoundError')

const createItem = async(client, queryKey, attributes) => {
  const { tableName: TableName, partitionKey, idKey, resourceName } = queryKey

  const isMissingKeyAttributes = !attributes[partitionKey] || !attributes[idKey]

  if (isMissingKeyAttributes) {
    const message = `Attributes "${partitionKey}" and "${idKey}" should be` +
      ` defined to create resource "${resourceName}"`

    throw new InvalidAttributesError(message, { queryKey, attributes })
  }

  const documentId = attributes[idKey]

  const keys  = {}
  keys[idKey] = documentId

  const putParameters = {
    TableName,
    Item:                      attributes,
    ConditionExpression:       `#${idKey} <> :${idKey}`,
    ExpressionAttributeNames:  {},
    ExpressionAttributeValues: {}
  }

  putParameters.ExpressionAttributeNames[`#${idKey}`]  = idKey
  putParameters.ExpressionAttributeValues[`:${idKey}`] = documentId

  try {
    await client.put(putParameters).promise()

  } catch (dynamoError) {
    if (dynamoError.code === 'ConditionalCheckFailedException') {
      throw new ResourceExistsError(resourceName, keys)
    }

    if (dynamoError.code === 'ResourceNotFoundException') {
      throw new CollectionNotFoundError(resourceName, TableName)
    }

    throw dynamoError
  }
}

module.exports = createItem
