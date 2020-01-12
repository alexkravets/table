'use strict'

const getPrimaryKey           = require('./getPrimaryKey')
const getProjectionExpression = require('./getProjectionExpression')

const buildGetParameters = (queryKey, query, options) => {
  const parameters = {
    Key:       getPrimaryKey(queryKey, query),
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
