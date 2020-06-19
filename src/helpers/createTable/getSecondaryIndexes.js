'use strict'

const getIndexSchema = require('./getIndexSchema')

const getSecondaryIndexes = (partitionKey, indexes, options) => {
  let LocalSecondaryIndexes  = null
  let GlobalSecondaryIndexes = null

  for (const indexKey in indexes) {
    const index   = indexes[indexKey]
    const isLocal = !index.partitionKey

    if (isLocal) {
      const { sortKey, ...otherOptions } = index
      const schema = getIndexSchema(indexKey, partitionKey, sortKey, otherOptions)

      LocalSecondaryIndexes = LocalSecondaryIndexes ? LocalSecondaryIndexes : []
      LocalSecondaryIndexes.push(schema)

    } else {
      const { partitionKey, sortKey, ...otherOptions } = index
      const schema = getIndexSchema(indexKey, partitionKey, sortKey, { ...options, ...otherOptions })

      GlobalSecondaryIndexes = GlobalSecondaryIndexes ? GlobalSecondaryIndexes : []
      GlobalSecondaryIndexes.push(schema)
    }
  }

  return { LocalSecondaryIndexes, GlobalSecondaryIndexes }
}

module.exports = getSecondaryIndexes
