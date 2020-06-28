'use strict'

class CommonError extends Error {
  constructor(code, message, context) {
    if (context) {
      const contextJson = JSON.stringify(context, null, 2)
      message = `${message} ${contextJson}`
    }

    super(message)

    this._code = code
  }

  get code() {
    return this._code
  }
}

module.exports = CommonError

