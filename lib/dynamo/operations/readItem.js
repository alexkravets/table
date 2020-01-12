'use strict'

const getItem       = require('./getItem')
const indexItems    = require('./indexItems')
const getPrimaryKey = require('../helpers/getPrimaryKey')
const ResourceNotFoundError = require('../../errors/ResourceNotFoundError')

const readItem = async(client, tableKey, query, options) => {
  let item

  const shouldGetItem = tableKey.isPrimary && !!getPrimaryKey(tableKey, query, false)

  if (shouldGetItem) {
    item = await getItem(client, tableKey, query, options)

  } else {
    options = { ...options, limit: 1 }

    const { items } = await indexItems(client, tableKey, query, options)

    item = items[0]

  }

  if (item) { return item }

  throw new ResourceNotFoundError(query, options)
}

module.exports = readItem
