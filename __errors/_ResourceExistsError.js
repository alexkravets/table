'use strict'

const CommonError = require('./CommonError')

class ResourceExistsError extends CommonError {
  constructor(resourceName, context) {
    super('ResourceExistsError', `Resource "${resourceName}" already exists`, context)
  }
}

module.exports = ResourceExistsError
