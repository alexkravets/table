'use strict'

const buildGetParameters    = require('../helpers/buildGetParameters')
const ResourceNotFoundError = require('../../errors/ResourceNotFoundError')

const getItem = async(client, queryKey, query, options) => {
  const getParameters = buildGetParameters(queryKey, query, options)

  let result
  try {

    result = await client.get(getParameters).promise()

  } catch (error) {
    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Table ${getParameters.TableName} doesn't exists`)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw error
  }

  if (result.Item) { return result.Item }

  throw new ResourceNotFoundError(getParameters.Key, options)
}

module.exports = getItem
