'use strict'

const InvalidItemKeyError = require('../errors/InvalidItemKeyError')

const buildKey = (methodName, indexKey, attributes) => {
  const { partitionKey, sortKey } = indexKey

  const sortKeyValue      = attributes[sortKey]
  const partitionKeyValue = attributes[partitionKey]

  const isMissingKeyAttributes = !!partitionKeyValue && !!sortKeyValue

  if (!isMissingKeyAttributes) {
    const message = `Item method "${methodName}" requires "${partitionKey}"` +
      ` and "${sortKey}" attributes to be provided`

    throw new InvalidItemKeyError(message, { indexKey, attributes })
  }

  return {
    [sortKey]:      sortKeyValue,
    [partitionKey]: partitionKeyValue
  }
}

module.exports = buildKey
