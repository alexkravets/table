'use strict'

const TableNotFoundError = require('../errors/TableNotFoundError')

const queryItems = async (client, tableName, parameters) => {
  let result

  try {
    result = await client.query(parameters).promise()

  } catch (dynamoError) {
    /* istanbul ignore else */
    if (dynamoError.name === 'ResourceNotFoundException') {
      throw new TableNotFoundError(tableName)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return result
}

module.exports = queryItems
