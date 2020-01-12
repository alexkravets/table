'use strict'

const Dynamo = require('src/Dynamo')

const DynamoDocumentCustomPartitionKey = class extends Dynamo(class {}) {
  static get documentIdKey() {
    return 'id'
  }

  static get tablePartitionKey() {
    return 'unit'
  }

  static documentId({ lastName, firstName }) {
    return `${lastName}#${firstName}`
  }
}

module.exports = DynamoDocumentCustomPartitionKey
