'use strict'

const getItem      = require('./getItem')
const indexItems   = require('./indexItems')
const buildItemKey = require('../helpers/buildItemKey')
const ResourceNotFoundError = require('../../../errors/ResourceNotFoundError')

const readItem = async(client, queryKey, query, options) => {
  const { isPrimary, resourceName } = queryKey

  let item

  const shouldGetItem = isPrimary && !!buildItemKey('Read', queryKey, query, false)

  if (shouldGetItem) {
    item = await getItem(client, queryKey, query, options)

  } else {
    options = { ...options, limit: 1 }

    const { items } = await indexItems(client, queryKey, query, options)

    item = items[0]

  }

  if (item) { return item }

  throw new ResourceNotFoundError(resourceName, { queryKey, query, options })
}

module.exports = readItem
