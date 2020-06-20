'use strict'

const queryItems           = require('./queryItems')
const queryString          = require('querystring')
const InvalidQueryError    = require('../errors/InvalidQueryError')
const buildQueryParameters = require('./buildQueryParameters')

const listItems = async (client, tableName, indexKey, query, options) => {
  const { partitionKey } = indexKey
  const partitionValue   = query[partitionKey]

  if (!partitionValue) {
    const message = `Item method "Query" requires "${partitionKey}"` +
      ' attribute to be provided'

    throw new InvalidQueryError(message, { query, options })
  }

  const parameters = buildQueryParameters(tableName, indexKey, query, options)

  const { limit } = options
  const hasLimit  = !!limit

  let items = []
  let count = 0
  let lastEvaluatedKey
  let isNextChunkRequired = true

  do {
    const { Items: chunk, LastEvaluatedKey } = await queryItems(client, tableName, parameters)

    items = [ ...items, ...chunk ]
    count = items.length

    if (hasLimit && count > limit) {
      items = items.slice(0, limit)
      count = limit
    }

    lastEvaluatedKey    = LastEvaluatedKey
    isNextChunkRequired = (hasLimit && count < limit) && !!LastEvaluatedKey

    parameters.ExclusiveStartKey = LastEvaluatedKey

  } while (isNextChunkRequired)

  if (lastEvaluatedKey) {
    lastEvaluatedKey = queryString.stringify(lastEvaluatedKey)
  }

  return { items, count, lastEvaluatedKey }
}

module.exports = listItems
