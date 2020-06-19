'use strict'

const ResourceUpdateError     = require('../../../errors/ResourceUpdateError')
const ResourceNotFoundError   = require('../../../errors/ResourceNotFoundError')
const buildUpdateParameters   = require('../helpers/buildUpdateParameters')
const InvalidAttributesError  = require('../../../errors/InvalidAttributesError')
const CollectionNotFoundError = require('../../../errors/CollectionNotFoundError')

const updateItem = async(client, queryKey, query, attributes) => {
  const { resourceName, tableName, partitionKey, idKey } = queryKey

  const shouldUpdatePartitionKey = !!attributes[partitionKey]
  const shouldUpdateId = !!attributes[idKey]

  if (shouldUpdatePartitionKey) {
    const message = `Update of partition key "${partitionKey}" for` +
      ` "${resourceName}" is restricted`

    throw new InvalidAttributesError(message, { queryKey, query, attributes })
  }

  if (shouldUpdateId) {
    throw new InvalidAttributesError(
      `Update of ID key "${idKey}" for "${resourceName}" is restricted`,
      { queryKey, query, attributes })
  }

  const updateParameters = buildUpdateParameters(queryKey, query, attributes)

  let result
  try {
    result = await client.update(updateParameters).promise()

  } catch (dynamoError) {
    if (dynamoError.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError(resourceName, { queryKey, query, attributes })
    }

    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (dynamoError.code === 'ResourceNotFoundException') {
      throw new CollectionNotFoundError(resourceName, tableName)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw new ResourceUpdateError(dynamoError, query, attributes)
  }

  return result.Attributes
}

module.exports = updateItem
