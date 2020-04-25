'use strict'

const buildItemKey = require('./buildItemKey')
const getProjectionExpression = require('./getProjectionExpression')

const buildGetParameters = (queryKey, query, options) => {
  const Key = buildItemKey('Read', queryKey, query)

  const parameters = {
    Key,
    TableName: queryKey.tableName,
  }

  const { projection } = options

  if (projection) {
    const {
      ProjectionExpression,
      ExpressionAttributeNames
    } = getProjectionExpression(projection)

    parameters.ProjectionExpression     = ProjectionExpression
    parameters.ExpressionAttributeNames = ExpressionAttributeNames
  }

  const { ConsistentRead } = options
  parameters.ConsistentRead = ConsistentRead ? ConsistentRead : false

  return parameters
}

module.exports = buildGetParameters
