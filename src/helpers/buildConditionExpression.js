'use strict'

// NOTE: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html
const buildConditionExpression = query => {
  let ConditionExpression         = []
  const ExpressionAttributeNames  = {}
  const ExpressionAttributeValues = {}

  for (let key in query) {
    let path          = '#Q_' + key.replace(/\./g, '.#Q_')
    const valueKey    = key.replace(/\.|:/g, '_')
    const filterValue = query[key]

    const isNot         = key.endsWith(':not')
    const isContains    = key.endsWith(':contains')
    const isLessThan    = key.endsWith(':lt')
    const isGreaterThan = key.endsWith(':gt')
    const isNotContains = key.endsWith(':not_contains')

    if (isNot) {
      key = key.replace(/:not/g, '')
    }

    if (isContains) {
      key = key.replace(/:contains/g, '')
    }

    if (isNotContains) {
      key = key.replace(/:not_contains/g, '')
    }

    if (isLessThan) {
      key = key.replace(/:lt/g, '')
    }

    if (isGreaterThan) {
      key = key.replace(/:gt/g, '')
    }

    const pathKeys = key.split('.')

    for (const pathKey of pathKeys) {
      ExpressionAttributeNames[`#Q_${pathKey}`] = pathKey
    }

    const isFilterValueArray = Array.isArray(filterValue)

    if (isFilterValueArray) {
      const filterValues = filterValue.entries()
      const valueKeys    = []

      for (const [ index, value ] of filterValues) {
        ExpressionAttributeValues[`:Q_${valueKey}${index + 1}`] = value
        valueKeys.push(`:Q_${valueKey}${index + 1}`)
      }

      ConditionExpression.push(`${path} in (${valueKeys})`)

    } else {
      ExpressionAttributeValues[`:Q_${valueKey}`] = filterValue

      if (isNot) {
        path = path.replace(/:not/, '')
        ConditionExpression.push(`${path} <> :Q_${valueKey}`)

      } else if (isContains) {
        path = path.replace(/:contains/, '')
        ConditionExpression.push(`contains(${path}, :Q_${valueKey})`)

      } else if (isNotContains) {
        path = path.replace(/:not_contains/, '')
        ConditionExpression.push(`not contains(${path}, :Q_${valueKey})`)

      } else if (isLessThan) {
        path = path.replace(/:lt/, '')
        ConditionExpression.push(`${path} < :Q_${valueKey}`)

      } else if (isGreaterThan) {
        path = path.replace(/:gt/, '')
        ConditionExpression.push(`${path} > :Q_${valueKey}`)

      } else {
        ConditionExpression.push(`${path} = :Q_${valueKey}`)

      }
    }
  }

  ConditionExpression = ConditionExpression.join(' AND ')

  const parameters = {
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  if (ConditionExpression === '') {
    return parameters
  }

  return { ...parameters, ConditionExpression }
}

module.exports = buildConditionExpression
