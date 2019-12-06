'use strict'

const endsWith              = require('lodash.endswith')
const ResourceUpdateError   = require('../errors/ResourceUpdateError')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')
const { getConditionExpression, getPrimaryKey } = require('./helpers')

const extendParametersWithUpdateExpression = (parameters, attributes) => {
  const UpdateExpressions = []

  for (let name in attributes) {
    const expressionValue = attributes[name]
    const arrayItemIndex  = name.match(/\[\d+\]/g)
    name = name.replace(/\[\d+\]/g, '')

    let path = '#' + name.replace(/\./g, '.#')
    const valueKey  = name.replace(/\.|:/g, '_')
    const isAppend  = endsWith(name, ':append')
    const isPrepend = endsWith(name, ':prepend')

    name = name.replace(/:append/, '')
    name = name.replace(/:prepend/, '')

    const pathKeys = name.split('.')

    for (const pathKey of pathKeys) {
      parameters.ExpressionAttributeNames[`#${pathKey}`] = pathKey
    }

    if (isAppend || isPrepend) {
      path = path.replace(/:append/, '')
      path = path.replace(/:prepend/, '')

      parameters.ExpressionAttributeValues[`:${valueKey}`]      = [ expressionValue ]
      parameters.ExpressionAttributeValues[`:${valueKey}_item`] = expressionValue
      parameters.ConditionExpression += ` AND not contains (${path}, :${valueKey}_item)`

      if (isAppend) {
        UpdateExpressions.push(`${path} = list_append(#${name}, :${valueKey})`)

      } else {
        UpdateExpressions.push(`${path} = list_append(:${valueKey}, #${name})`)

      }

    } else {
      parameters.ExpressionAttributeValues[`:${valueKey}`] = expressionValue
      path = `${path}${arrayItemIndex ? arrayItemIndex : ''}`

      UpdateExpressions.push(`${path} = :${valueKey}`)
    }
  }

  parameters.UpdateExpression = `SET ${UpdateExpressions.join(', ')}`
}

const updateItem = async(
  client,
  TableName,
  { partitionKey, sortKey },
  query,
  attributes) => {

  if (attributes[partitionKey]) {
    query[partitionKey] = attributes[partitionKey]
    delete attributes[partitionKey]
  }

  const Key = getPrimaryKey(TableName, partitionKey, sortKey, query)
  delete query[partitionKey]

  const conditionParameters = getConditionExpression(query)
  extendParametersWithUpdateExpression(conditionParameters, attributes)

  const ReturnValues = 'ALL_NEW'
  const parameters   = { Key, TableName, ReturnValues, ...conditionParameters }

  let result
  try {
    result = await client.update(parameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError({ ...Key, ...query })
    }

    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw new ResourceUpdateError(error, query, attributes)
  }

  return result.Attributes
}

module.exports = updateItem
