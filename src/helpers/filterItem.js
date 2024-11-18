'use strict'

const { get } = require('lodash')

const filterItem = (item, conditionsMap) => {
  if (!item) {
    return
  }

  const conditionEntries = Object.entries(conditionsMap)

  for (const [key, value] of conditionEntries) {
    const isNot         = key.endsWith(':not')
    const isContains    = key.endsWith(':contains')
    // const isLessThan    = key.endsWith(':lt')
    // const isGreaterThan = key.endsWith(':gt')
    const isNotContains = key.endsWith(':not_contains')
    const isFilterValueArray = Array.isArray(value)

    const isFilterValueNull = value === null

    let path = key
    let match = (a, b) => a === b

    if (isNot) {
      path = key.replace(/:not/g, '')
      match = (a, b) => a !== b
    }

    if (isFilterValueNull) {
      if (isNot) {
        match = (a) => a !== undefined
      } else {
        match = (a) => a === undefined
      }
    }

    if (isContains) {
      path = key.replace(/:contains/g, '')
      match = (a, b) => a.includes(b)
    }

    if (isNotContains) {
      path = key.replace(/:not_contains/g, '')
      match = (a, b) => !a.includes(b)
    }

    if (isFilterValueArray) {
      match = (a, b) => b.includes(a)
    }

    // if (isLessThan) {
    //   path = key.replace(/:lt/g, '')
    // }

    // if (isGreaterThan) {
    //   path = key.replace(/:gt/g, '')
    // }

    const itemValue = get(item, path)
    const isMatched = match(itemValue, value)

    if (isMatched) {
      continue
    }

    const condition = JSON.stringify({ [key]: value })
    console.log(`Unmatched condition ${condition}, item[${path}] is ${itemValue}`)

    return
  }

  return item
}

module.exports = filterItem
