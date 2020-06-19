'use strict'

const { expect } = require('chai')

const expectError = async (fn, value, key = 'code') => {
  try {
    await fn()

  } catch (error) {
    // console.log(error)

    expect(error).to.have.property(key)
    expect(error[key]).to.include(value)
    return

  }

  throw new Error('Expected exception has not been thrown')
}

module.exports = {
  expect,
  expectError
}
