'use strict'

const expectError = async (fn) => {
  try {
    await fn()

  } catch (error) {
    return error

  }

  throw new Error('Expected error has not been thrown')
}

module.exports = expectError
