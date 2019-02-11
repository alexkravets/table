'use strict'

const endsWith = require('lodash.endswith')

const getProjectionExpression = projectionAttributes => {
  const ProjectionExpression     = []
  const ExpressionAttributeNames = {}

  for (let attribute of projectionAttributes) {
    attribute = attribute.trim()

    const attributeKeys = attribute.split('.')
    const attributeNames = []

    for (let attributeKey of attributeKeys) {
      const arrayIndex = attributeKey.match(/\[\d+\]/g)
      attributeKey = attributeKey.replace(/\[\d+\]/g, '')
      ExpressionAttributeNames[`#${attributeKey}`] = attributeKey

      const attributeName = `#${attributeKey}${arrayIndex ? arrayIndex : ''}`
      attributeNames.push(attributeName)
    }
    ProjectionExpression.push(attributeNames.join('.'))
  }

  return {
    ProjectionExpression: ProjectionExpression.join(','),
    ExpressionAttributeNames
  }
}

const getConditionExpression = query => {
  let ConditionExpression         = []
  const ExpressionAttributeNames  = {}
  const ExpressionAttributeValues = {}

  for (let key in query) {
    let path          = '#Q_' + key.replace(/\./g, '.#Q_')
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
      ExpressionAttributeNames[`#Q_${pathKey}`] = pathKey
    }

    const isFilterValueArray = Array.isArray(filterValue)

    if (isFilterValueArray) {
      const filterValues = filterValue.entries()

      for (const [ index, value ] of filterValues) {
        ExpressionAttributeValues[`:Q_${valueKey}${index + 1}`] = value
      }

      const valueKeys = Object.keys(ExpressionAttributeValues)
      ConditionExpression.push(`${path} in (${valueKeys})`)

    } else {
      ExpressionAttributeValues[`:Q_${valueKey}`] = filterValue

      if (isContains) {
        path = path.replace(/:contains/, '')
        ConditionExpression.push(`contains(${path}, :Q_${valueKey})`)

      } else if (isNot) {
        path = path.replace(/:not/, '')
        ConditionExpression.push(`${path} <> :Q_${valueKey}`)

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

module.exports = {
  getProjectionExpression,
  getConditionExpression
}
