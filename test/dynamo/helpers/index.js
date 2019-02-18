'use strict'

const Dynamo     = require('lib/dynamo')
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

const DynamoDocument = class extends Dynamo(class {}) {
  static documentId({ lastName }) {
    return lastName
  }

  static get indexes() {
    return {
      ...super.indexes,
      unitIndex: { partitionKey: 'unit' }
    }
  }
}

const DynamoDocumentCustomPartitionKey = class extends Dynamo(class {}) {
  static get tablePartitionKey() {
    return 'unit'
  }

  static get indexes() {
    return {}
  }
}

module.exports = {
  Dynamo,
  expect,
  expectError,
  DynamoDocument,
  DynamoDocumentCustomPartitionKey
}
