'use strict'

const InvalidQueryError = require('../../../errors/InvalidQueryError')

const buildItemKey = (intent, queryKey, query, shouldThrowError = true) => {
  const { resourceName, partitionKey, sortKey } = queryKey

  const sortKeyValue      = query[sortKey]
  const partitionKeyValue = query[partitionKey]

  const isMissingKeyAttributes = !!partitionKeyValue && !!sortKeyValue

  if (!isMissingKeyAttributes) {
    if (!shouldThrowError) { return }

    const message = `${intent} item query for "${resourceName}" should` +
      ` include "${partitionKey}" and "${sortKey}" attributes`

    throw new InvalidQueryError(
      message,
      { queryKey, query })
  }

  const key = {}
  key[sortKey]      = sortKeyValue
  key[partitionKey] = partitionKeyValue

  return key
}

module.exports = buildItemKey
