'use strict'

const TableNotFoundError     = require('../errors/TableNotFoundError')
const ResourceExistsError    = require('../errors/ResourceExistsError')
const InvalidAttributesError = require('../errors/InvalidAttributesError')

const createItem = async (client, primaryKey, resourceName, attributes) => {
  const { tableName: TableName, partitionKey, sortKey: idKey } = primaryKey

  const isMissingKeyAttributes = !attributes[partitionKey] || !attributes[idKey]

  if (isMissingKeyAttributes) {
    const message = `Attributes "${partitionKey}" and "${idKey}" should be` +
      ` defined to create resource "${resourceName}"`

    throw new InvalidAttributesError(message, { primaryKey, attributes })
  }

  const documentId = attributes[idKey]
  const key = { [idKey]: documentId }

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
      throw new ResourceExistsError(resourceName, { key })
    }

    /* istanbul ignore else */
    if (dynamoError.code === 'ResourceNotFoundException') {
      throw new TableNotFoundError(TableName)
    }

    /* istanbul ignore next */
    throw dynamoError
  }
}

module.exports = createItem
