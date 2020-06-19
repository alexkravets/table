'use strict'

const Dynamo = require('src/adaptors/Dynamo')
const { expect } = require('chai')

const expectError = async(fn, key, value) => {
  try {
    await fn()

  } catch (error) {
    expect(error).to.have.property(key)
    expect(error[key]).to.include(value)
    return

  }

  throw new Error('Expected exception has not been thrown')
}

module.exports = {
  wait:                             require('./wait'),
  DynamoDocument:                   require('./DynamoDocument'),
  DynamoDocumentCustomPartitionKey: require('./DynamoDocumentCustomPartitionKey'),
  Dynamo,
  expect,
  expectError
}
