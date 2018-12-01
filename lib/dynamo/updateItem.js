'use strict'

const endsWith = require('lodash.endswith')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const getUpdateParameters = (id, attributes) => {
  const UpdateExpressions         = []
  const ConditionExpressions      = [ 'id = :id' ]
  const ExpressionAttributeNames  = {}
  const ExpressionAttributeValues = { ':id': id }

  for (let name in attributes) {
    const isAppend = endsWith(name, ':append')

    const expressionValue = attributes[name]
    name = name.replace(/:append/, '')

    ExpressionAttributeNames[`#${name}`] = name

    if (isAppend) {
      ExpressionAttributeValues[`:${name}`]      = [ expressionValue ]
      ExpressionAttributeValues[`:${name}_item`] = expressionValue

      ConditionExpressions.push(`not contains (#${name}, :${name}_item)`)
      UpdateExpressions.push(`#${name} = list_append(#${name}, :${name})`)

    } else {
      ExpressionAttributeValues[`:${name}`] = attributes[name]

      UpdateExpressions.push(`#${name} = :${name}`)
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
    if (error.code == 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError(resourceName, parameters.ConditionExpression)
    }

    if (error.code == 'ResourceNotFoundException') {
      throw new Error(`Table ${TableName} doesn't exists`)
    }

    throw error
  }

  return result.Attributes
}

module.exports = updateItem
