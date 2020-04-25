'use strict'

const { expect } = require('chai')

module.exports = {
  Dynamo:           require('src/adaptors/Dynamo'),
  expectError:      require('./expectError'),
  AbstractDocument: require('./AbstractDocument'),
  expect
}
