'use strict'

const querystring = require('querystring')
const buildQueryParameters = require('../helpers/buildQueryParameters')

const executeQuery = async(client, parameters) => {
  try {
    return await client.query(parameters).promise()

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Table ${parameters.TableName} doesn't exists`)
    }

    throw error
  }
}

const indexItems = async(client, queryKey, query, options) => {
  const queryParameters = buildQueryParameters(queryKey, query, options)

  const { limit } = options
  const hasLimit  = !!limit

  let items = []
  let count = 0
  let lastEvaluatedKey
  let isNextChunkRequired = true

  do {
    const { Items: chunk, LastEvaluatedKey } = await executeQuery(client, queryParameters)

    items = [ ...items, ...chunk ]
    count = items.length

    if (hasLimit && count > limit) {
      items = items.slice(0, limit)
      count = limit
    }

    lastEvaluatedKey    = LastEvaluatedKey
    isNextChunkRequired = (hasLimit && count < limit) && LastEvaluatedKey

    queryParameters.ExclusiveStartKey = LastEvaluatedKey

  } while (isNextChunkRequired)

  if (lastEvaluatedKey) {
    lastEvaluatedKey = querystring.stringify(lastEvaluatedKey)
  }

  return { items, count, lastEvaluatedKey }
}

module.exports = indexItems
