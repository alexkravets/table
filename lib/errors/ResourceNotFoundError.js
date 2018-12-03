'use strict'

class ResourceNotFoundError extends Error {
  constructor(resourceName, query) {
    query = JSON.stringify({ query })
    super(`${resourceName} is not found ${query}`)
  }

  get code() {
    return this.constructor.name
  }
}

module.exports = ResourceNotFoundError
