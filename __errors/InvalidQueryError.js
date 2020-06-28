'use strict'

const CommonError = require('./CommonError')

class InvalidQueryError extends CommonError {
  constructor(message, context) {
    super('InvalidQueryError', message, context)
  }
}

module.exports = InvalidQueryError
