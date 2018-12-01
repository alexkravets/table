'use strict'

const indexItems = require('./indexItems')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const readItem = async(client, resourceName, TableName, query, options = {}) => {
  const { id } = query

  if (!id) {
    options = { ...options, limit: 1 }
    const { items } = await indexItems(client, resourceName, TableName, query, options)
    const [ item ]  = items

    if (!item) {
      throw new ResourceNotFoundError(resourceName, query)
    }

    return item
  }

  const Key = { id }

  let result
  try {
    result = await client.get({ TableName, Key }).promise()

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
