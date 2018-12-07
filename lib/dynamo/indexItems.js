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
    const isNot       = endsWith(key, ':not')
    const valueKey    = key.replace(/\.|:/g, '_')
    const filterValue = query[key]

    if (isContains) {
      key = key.replace(/:contains/g, '')
    }

    if (isNot) {
      key = key.replace(/:not/g, '')
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

      } else if (isNot) {
        path = path.replace(/:not/, '')
        FilterExpression.push(`${path} <> :${valueKey}`)

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

const getProjectionExpression = (projectionAttributes, parameters) => {
  const ProjectionExpression = []
  const { ExpressionAttributeNames } = parameters

  for (let attribute of projectionAttributes) {
    attribute = attribute.trim()

    const attributeKeys = attribute.split('.')
    const attributeNames = []

    for (let attributeKey of attributeKeys) {
      const arrayIndex = attributeKey.match(/\[\d+\]/g)
      attributeKey = attributeKey.replace(/\[\d+\]/g, '')

      const attributeName = `#${attributeKey}${arrayIndex ? arrayIndex : ''}`

      if (!ExpressionAttributeNames[`#${attributeKey}`]) {
        ExpressionAttributeNames[`#${attributeKey}`] = attributeKey
      }

      attributeNames.push(attributeName)
    }
    ProjectionExpression.push(attributeNames.join('.'))
  }

  return ProjectionExpression.join(',')
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

const indexItems = async(client, resourceName, TableName, query = {}, options = {}, indexes) => {
  const { indexName, exclusiveStartKey, limit, sort, projection } = options
  const ScanIndexForward = (sort == 'asc')

  const IndexName       = indexName || 'defaultIndex'
  const { primaryKey }  = indexes[IndexName]
  const primaryKeyValue = query[primaryKey] || resourceName

  delete query[primaryKey]

  let parameters = getFilterParameters(query)

  parameters.KeyConditionExpression = `#${primaryKey} = :${primaryKey}`
  parameters.ExpressionAttributeNames[`#${primaryKey}`]  = primaryKey
  parameters.ExpressionAttributeValues[`:${primaryKey}`] = primaryKeyValue

  parameters = { TableName, IndexName, ScanIndexForward, ...parameters }

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
  }

  if (projection) {
    parameters.ProjectionExpression = getProjectionExpression(projection, parameters)
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
