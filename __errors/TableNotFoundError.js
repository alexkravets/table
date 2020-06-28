'use strict'

const CommonError = require('./CommonError')

class TableNotFoundError extends CommonError {
  constructor(tableName) {
    super('TableNotFoundError', `Table "${tableName}" doesn't exist`)
  }
}

module.exports = TableNotFoundError
