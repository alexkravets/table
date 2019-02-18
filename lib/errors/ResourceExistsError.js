'use strict'

class ResourceExistsError extends Error {
  constructor(resourceName, id) {
    super(`${resourceName} with ID "${id}" already exists`)
  }

  get code() {
    return this.constructor.name
  }
}

module.exports = ResourceExistsError
