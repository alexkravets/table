'use strict'

const indexItems            = require('./indexItems')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')
const { getProjectionExpression, getPrimaryKey } = require('./helpers')

const getByPrimaryKey = async(client, TableName, Key, options) => {
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

const getFirstByQuery = async(client, TableName, partitionKey, indexes, query, options) => {
  options = { ...options, limit: 1 }
  const { items } = await indexItems(
    client,
    TableName,
    { partitionKey },
    indexes,
    query,
    options)

  const [ item ]  = items

  if (!item) {
    throw new ResourceNotFoundError(query, options)
  }

  return item
}

const readItem = async(
  client,
  TableName,
  { partitionKey, sortKey },
  indexes,
  query,
  options) => {

  const primaryKey = getPrimaryKey(TableName, partitionKey, sortKey, query, false)

  if (primaryKey) {
    return getByPrimaryKey(client, TableName, primaryKey, options)
  }

  return getFirstByQuery(client, TableName, partitionKey, indexes, query, options)
}

module.exports = readItem
