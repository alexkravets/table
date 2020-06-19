'use strict'

const getIndexSchema = (IndexName, partitionKey, sortKey, options) => {
  const KeySchema = [
    { KeyType: 'HASH', AttributeName: partitionKey }
  ]

  if (sortKey) {
    KeySchema.push({ KeyType: 'RANGE', AttributeName: sortKey })
  }

  return {
    Projection: {
      ProjectionType: 'ALL'
    },
    IndexName,
    KeySchema,
    ...options
  }
}

module.exports = getIndexSchema
