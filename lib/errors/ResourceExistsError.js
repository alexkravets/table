'use strict'

class ResourceExistsError extends Error {
  constructor(resourceName, primaryKey) {
    super(`${resourceName} with primaryKey '${primaryKey}' already exists`)
  }

  get code() {
    return this.constructor.name
  }
}

module.exports = ResourceExistsError
