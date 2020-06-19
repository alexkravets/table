'use strict'

const uniq = require('lodash.uniq')

const getAttributeDefinitions = (partitionKey, sortKey, indexes) => {
  const AttributeDefinitions = []

  let attributes = [ partitionKey, sortKey ]

  for (const indexKey in indexes) {
    const { partitionKey, sortKey } = indexes[indexKey]

    if (partitionKey) {
      attributes.push(partitionKey)
    }

    if (sortKey) {
      attributes.push(sortKey)
    }
  }

  attributes = uniq(attributes)

  for (const AttributeName of attributes) {
    // TODO: This should be based on schema.
    AttributeDefinitions.push({ AttributeName, AttributeType: 'S' })
  }

  return AttributeDefinitions
}

module.exports = getAttributeDefinitions
