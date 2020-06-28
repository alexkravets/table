'use strict'

const createError = (message, context) => {
  if (context) {
    const contextJson = JSON.stringify(context, null, 2)
    message = `${message} ${contextJson}`
  }

  return new Error(message)
}

module.exports = createError
