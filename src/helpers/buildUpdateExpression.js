'use strict'

const buildUpdateExpression = (parameters, attributes) => {
  const UpdateExpressions = []
  const RemoveExpressions = []

  for (let name in attributes) {
    const expressionValue = attributes[name]

    const arrayItemIndex  = name.match(/\[\d+\]/g)
    name = name.replace(/\[\d+\]/g, '')

    let path = '#' + name.replace(/\./g, '.#')

    const valueKey  = name.replace(/\.|:/g, '_')
    const isAppend  = name.endsWith(':append')
    const isPrepend = name.endsWith(':prepend')

    name = name.replace(/:append/, '')
    name = name.replace(/:prepend/, '')

    const pathKeys = name.split('.')

    for (const pathKey of pathKeys) {
      parameters.ExpressionAttributeNames[`#${pathKey}`] = pathKey
    }

    const shouldRemoveAttribute = expressionValue === null

    if (shouldRemoveAttribute) {
      RemoveExpressions.push(`${path}`)
      continue
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

  const expressions          = []
  const hasRemoveAttributes  = RemoveExpressions.length > 0
  const hasUpdateExpressions = UpdateExpressions.length > 0

  if (hasUpdateExpressions) {
    expressions.push(`SET ${UpdateExpressions.join(', ')}`)
  }

  if (hasRemoveAttributes) {
    expressions.push(`REMOVE ${RemoveExpressions.join(', ')}`)
  }

  parameters.UpdateExpression = expressions.join(' ')

  return parameters
}

module.exports = buildUpdateExpression
