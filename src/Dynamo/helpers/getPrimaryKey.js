'use strict'

const getPrimaryKey = (queryKey, query, shouldThrowError = true) => {
  const sortKeyValue      = query[queryKey.sortKey]
  const partitionKeyValue = query[queryKey.partitionKey]

  const parametersJson = JSON.stringify({ query, queryKey }, null, 2)

  const isQueryConsistent = !!partitionKeyValue && !!sortKeyValue

  if (!isQueryConsistent) {
    if (!shouldThrowError) { return }

    throw new Error(`Query is missing primary key attributes, ${parametersJson}"`)
  }

  const primaryKey = {}
  primaryKey[queryKey.sortKey]      = sortKeyValue
  primaryKey[queryKey.partitionKey] = partitionKeyValue

  return primaryKey
}

module.exports = getPrimaryKey
