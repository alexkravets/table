'use strict'

const endsWith    = require('lodash.endswith')
const querystring = require('querystring')

const getFilterParameters = query => {
  let FilterExpression            = []
  const ExpressionAttributeNames  = {}
  const ExpressionAttributeValues = {}

  for (let key in query) {
    let path          = '#' + key.replace(/\./g, '.#')
    const isContains  = endsWith(key, ':contains')
    const valueKey    = key.replace(/\.|:/g, '_')
    const filterValue = query[key]

    if (isContains) {
      key = key.replace(/:contains/g, '')
    }

    const pathKeys = key.split('.')

    for (const pathKey of pathKeys) {
      ExpressionAttributeNames[`#${pathKey}`] = pathKey
    }

    const isFilterValueArray = Array.isArray(filterValue)

    if (isFilterValueArray) {
      const filterValues = filterValue.entries()

      for (const [ index, value ] of filterValues) {
        ExpressionAttributeValues[`:${valueKey}${index + 1}`] = value
      }

      const valueKeys = Object.keys(ExpressionAttributeValues)
      FilterExpression.push(`${path} in (${valueKeys})`)

    } else {
      ExpressionAttributeValues[`:${valueKey}`] = filterValue

      if (isContains) {
        path = path.replace(/:contains/, '')
        FilterExpression.push(`contains(${path}, :${valueKey})`)

      } else {
        FilterExpression.push(`${path} = :${valueKey}`)

      }
    }
  }

  FilterExpression = FilterExpression.join(' and ')

  const parameters = {
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  if (FilterExpression) {
    return { ...parameters, FilterExpression }
  }

  return parameters
}

const runQuery = async(client, TableName, parameters) => {
  try {
    return await client.query(parameters).promise()

  } catch (error) {
    if (error.name == 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }
}

const indexItems = async(client, resourceName, TableName, query = {}, options = {}) => {
  const { indexName, exclusiveStartKey, limit, sort } = options
  const ScanIndexForward = (sort == 'asc')

  let IndexName
  let parameters = getFilterParameters(query)

  if (indexName) {
    IndexName = 'defaultIndex' // indexName
    parameters.KeyConditionExpression = '#resourceName = :resourceName'
    parameters.ExpressionAttributeNames['#resourceName']  = 'resourceName'
    parameters.ExpressionAttributeValues[':resourceName'] = resourceName

  } else {
    IndexName = 'defaultIndex'
    parameters.KeyConditionExpression = '#resourceName = :resourceName'
    parameters.ExpressionAttributeNames['#resourceName']  = 'resourceName'
    parameters.ExpressionAttributeValues[':resourceName'] = resourceName

  }

  parameters = { TableName, IndexName, ScanIndexForward, ...parameters }

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
  }

  let items = []
  let count = 0
  let lastEvaluatedKey
  let isNextChunkRequired = true

  do {
    const { Items: chunk, LastEvaluatedKey } = await runQuery(client, TableName, parameters)

    items = [ ...items, ...chunk ]
    count = items.length

    if (!!limit && count > limit) {
      items = items.slice(0, limit)
      count = limit
    }

    lastEvaluatedKey    = LastEvaluatedKey
    isNextChunkRequired = (!!limit && count < limit) && LastEvaluatedKey
    parameters.ExclusiveStartKey = LastEvaluatedKey

  } while (isNextChunkRequired)

  if (lastEvaluatedKey) {
    lastEvaluatedKey = querystring.stringify(lastEvaluatedKey)
  }

  return { items, count, lastEvaluatedKey }
}

module.exports = indexItems
