'use strict'

const endsWith = require('lodash.endswith')
const ResourceNotFoundError      = require('../errors/ResourceNotFoundError')
const { getConditionExpression } = require('./helpers')

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

const updateItem = async(client, resourceName, TableName, query, attributes) => {
  const { id } = query

  const Key          = { id }
  const ReturnValues = 'ALL_NEW'

  let parameters = getConditionExpression(query)
  extendParametersWithUpdateExpression(parameters, attributes)

  parameters = { Key, TableName, ReturnValues, ...parameters }

  let result
  try {
    result = await client.update(parameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError(resourceName, query)
    }

    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }

  return result.Attributes
}

module.exports = updateItem
