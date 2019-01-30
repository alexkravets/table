'use strict'

const endsWith = require('lodash.endswith')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const getUpdateParameters = (id, attributes) => {
  const UpdateExpressions         = []
  const ConditionExpressions      = [ 'id = :id' ]
  const ExpressionAttributeNames  = {}
  const ExpressionAttributeValues = { ':id': id }

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
      ExpressionAttributeNames[`#${pathKey}`] = pathKey
    }

    if (isAppend || isPrepend) {
      path = path.replace(/:append/, '')
      path = path.replace(/:prepend/, '')

      ExpressionAttributeValues[`:${valueKey}`]      = [ expressionValue ]
      ExpressionAttributeValues[`:${valueKey}_item`] = expressionValue

      ConditionExpressions.push(`not contains (${path}, :${valueKey}_item)`)

      if (isAppend) {
        UpdateExpressions.push(`${path} = list_append(#${name}, :${valueKey})`)

      } else {
        UpdateExpressions.push(`${path} = list_append(:${valueKey}, #${name})`)

      }

    } else {
      ExpressionAttributeValues[`:${valueKey}`] = expressionValue
      path = `${path}${arrayItemIndex ? arrayItemIndex : ''}`

      UpdateExpressions.push(`${path} = :${valueKey}`)
    }
  }

  const UpdateExpression = `SET ${UpdateExpressions.join(', ')}`
  const ConditionExpression = ConditionExpressions.join(' and ')

  return {
    UpdateExpression,
    ConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }
}

const updateItem = async(client, resourceName, TableName, id, attributes) => {
  const Key          = { id }
  const ReturnValues = 'ALL_NEW'

  let parameters = getUpdateParameters(id, attributes)
  parameters = { Key, TableName, ReturnValues, ...parameters }

  let result
  try {
    result = await client.update(parameters).promise()

  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError(resourceName, parameters.ConditionExpression)
    }

    if (error.code === 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }

  return result.Attributes
}

module.exports = updateItem
