'use strict'

const ResourceUpdateError   = require('../../errors/ResourceUpdateError')
const ResourceNotFoundError = require('../../errors/ResourceNotFoundError')
const buildUpdateParameters = require('../helpers/buildUpdateParameters')

const updateItem = async(client, queryKey, query, attributes) => {
  const updateParameters = buildUpdateParameters(queryKey, query, attributes)

  let result
  try {
    result = await client.update(updateParameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError({ ...updateParameters.Key, ...query })
    }

    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${queryKey.tableName} doesn't exists`)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw new ResourceUpdateError(error, query, attributes)
  }

  return result.Attributes
}

module.exports = updateItem
