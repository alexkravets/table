'use strict'

const getPrimaryKey           = require('../helpers/getPrimaryKey')
const ResourceNotFoundError   = require('../../errors/ResourceNotFoundError')
const getProjectionExpression = require('../helpers/getProjectionExpression')

const getItem = async(client, tableKey, query, options) => {
  const Key = getPrimaryKey(tableKey, query, true)

  const { tableName: TableName } = tableKey

  let result
  try {
    const parameters = { TableName, Key }
    const { projection } = options

    if (projection) {
      const {
        ProjectionExpression,
        ExpressionAttributeNames
      } = getProjectionExpression(projection)

      parameters.ProjectionExpression = ProjectionExpression
      parameters.ExpressionAttributeNames = ExpressionAttributeNames
    }

    const { ConsistentRead } = options
    parameters.ConsistentRead = ConsistentRead ? ConsistentRead : false

    result = await client.get(parameters).promise()

  } catch (error) {
    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw error
  }

  if (result.Item) { return result.Item }

  throw new ResourceNotFoundError(Key, options)
}

module.exports = getItem
