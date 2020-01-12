'use strict'

const getPrimaryKey = (tableKey, query, shouldThrowError = true) => {
  const sortKeyValue      = query[tableKey.sortKey]
  const partitionKeyValue = query[tableKey.partitionKey]

  const parametersJson = JSON.stringify({ query, tableKey }, null, 2)

  const isQueryConsistent = !!partitionKeyValue && !!sortKeyValue

  if (!isQueryConsistent) {
    if (!shouldThrowError) { return }

    throw new Error(`Query is missing primary key attributes, ${parametersJson}"`)
  }

  const primaryKey = {}
  primaryKey[tableKey.sortKey]      = sortKeyValue
  primaryKey[tableKey.partitionKey] = partitionKeyValue

  return primaryKey
}

module.exports = getPrimaryKey
