'use strict'

const CommonError = require('./CommonError')

class InvalidItemKeyError extends CommonError {
  constructor(message, context) {
    super('InvalidItemKeyError', message, context)
  }
}

module.exports = InvalidItemKeyError
