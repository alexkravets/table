'use strict'

const CommonError = require('./CommonError')

class CollectionNotFoundError extends CommonError {
  constructor(resourceName, tableName) {
    super(
      'CollectionNotFoundError',
      `Collection "${resourceName}" doesn't exist`,
      { tableName })
  }
}

module.exports = CollectionNotFoundError
