'use strict'

class ResourceNotFoundError extends Error {
  constructor(resourceName, conditionExpression) {
    conditionExpression = JSON.stringify({ conditionExpression })
    super(`${resourceName} is not found ${ conditionExpression}`)
  }

  get code() {
    return this.constructor.name
  }
}

module.exports = ResourceNotFoundError
