'use strict'

const TableNotFoundError = require('../errors/TableNotFoundError')
const buildProjectionExpression = require('./buildProjectionExpression')

const getItem = async (client, TableName, Key, attributes, options) => {
  const parameters = {
    Key,
    TableName
  }

  const { projection, consistentRead } = options

  parameters.ConsistentRead = consistentRead ? consistentRead : false

  if (projection) {
    const {
      ProjectionExpression,
      ExpressionAttributeNames
    } = buildProjectionExpression(projection)

    parameters.ProjectionExpression     = ProjectionExpression
    parameters.ExpressionAttributeNames = ExpressionAttributeNames
  }

  let result

  try {
    result = await client.get(parameters).promise()

  } catch (dynamoError) {
    /* istanbul ignore else */
    if (dynamoError.name === 'ResourceNotFoundException') {
      throw new TableNotFoundError(TableName)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return result.Item
}

module.exports = getItem
