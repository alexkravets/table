'use strict'

class ResourceNotFoundError extends Error {
  constructor(query, options = {}) {
    const parameters = JSON.stringify({ query, options }, null, 2)
    super(`Resource not found: ${parameters}`)
  }

  get code() {
    return this.constructor.name
  }
}

module.exports = ResourceNotFoundError
