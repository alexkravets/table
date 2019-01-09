'use strict'

const indexItems = require('./indexItems')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')
const { getProjectionExpression } = require('./helpers')

const readItem = async(client, resourceName, TableName, query, options = {}, indexes) => {
  const { id } = query
  const isIdOnlyQuery = !!id && Object.keys(query).length == 1

  if (!isIdOnlyQuery) {
    options = { ...options, limit: 1 }
    const { items } = await indexItems(client, resourceName, TableName, query, options, indexes)
    const [ item ]  = items

    if (!item) {
      throw new ResourceNotFoundError(resourceName, query)
    }

    return item
  }

  const Key = { id }

  let result
  try {
    const { projection } = options
    const parameters = { TableName, Key }

    if (projection) {
      const {
        ProjectionExpression,
        ExpressionAttributeNames
      } = getProjectionExpression(projection)

      parameters.ProjectionExpression = ProjectionExpression
      parameters.ExpressionAttributeNames = ExpressionAttributeNames
    }

    result = await client.get(parameters).promise()

  } catch (error) {
    if (error.name == 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }

  if (result.Item) { return result.Item }

  throw new ResourceNotFoundError(resourceName, { id })
}

module.exports = readItem
