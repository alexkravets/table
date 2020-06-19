'use strict'

const omit         = require('lodash.omit')
const endsWith     = require('lodash.endswith')
const buildItemKey = require('../helpers/buildItemKey')
const getConditionExpression = require('../helpers/getConditionExpression')

const buildUpdateParameters = (queryKey, query, attributes) => {
  const { tableName, partitionKey } = queryKey

  // TODO: Check if we can update many items here:
  const Key = buildItemKey('Update', queryKey, query)

  query = omit(query, [ partitionKey ])
  const parameters = getConditionExpression(query)

  parameters.Key          = Key
  parameters.TableName    = tableName
  parameters.ReturnValues = 'ALL_NEW'

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

  return parameters
}

module.exports = buildUpdateParameters
