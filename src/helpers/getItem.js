'use strict'

const createError = require('./createError')
const buildProjectionExpression = require('./buildProjectionExpression')

const getItem = async (client, TableName, Key, options) => {
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
      throw createError(`Table "${TableName}" does not exist`)
    }

    /* istanbul ignore next */
    throw dynamoError
  }

  return result.Item
}

module.exports = getItem
