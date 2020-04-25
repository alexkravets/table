'use strict'

const CommonError = require('./CommonError')

class InvalidAttributesError extends CommonError {
  constructor(message, context) {
    super(
      'InvalidAttributesError',
      message,
      context)
  }
}

module.exports = InvalidAttributesError
