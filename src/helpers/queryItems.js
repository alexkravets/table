'use strict'

const createError = require('./createError')

const queryItems = async (client, tableName, parameters) => {
  let result

  try {
    result = await client.query(parameters)

  } catch (dynamoError) {
    /* istanbul ignore else */
    if (dynamoError.name === 'ResourceNotFoundException') {
      throw createError(`Table "${tableName}" does not exist`)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return result
}

module.exports = queryItems
