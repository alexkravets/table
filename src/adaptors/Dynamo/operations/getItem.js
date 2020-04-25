'use strict'

const buildGetParameters      = require('../helpers/buildGetParameters')
const ResourceNotFoundError   = require('../../../errors/ResourceNotFoundError')
const CollectionNotFoundError = require('../../../errors/CollectionNotFoundError')

const getItem = async(client, queryKey, query, options) => {
  const { resourceName, tableName } = queryKey

  const getParameters = buildGetParameters(queryKey, query, options)

  let result
  try {
    result = await client.get(getParameters).promise()

  } catch (dynamoError) {
    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (dynamoError.name === 'ResourceNotFoundException') {
      throw new CollectionNotFoundError(resourceName, tableName)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw dynamoError
  }

  if (result.Item) { return result.Item }

  throw new ResourceNotFoundError(resourceName, { queryKey, query, options })
}

module.exports = getItem
