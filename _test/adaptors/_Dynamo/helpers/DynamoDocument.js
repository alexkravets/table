'use strict'

const Dynamo = require('src/adaptors/Dynamo')

const DynamoDocument = class extends Dynamo(class {}) {
  static get documentIdKey() {
    return 'id'
  }

  static get defaultIndexSortKey() {
    return 'createdAt'
  }

  static get indexes() {
    return {
      ...super.indexes,
      unitIndex: { partitionKey: 'unit' }
    }
  }

  static documentId({ lastName }) {
    return lastName
  }
}

module.exports = DynamoDocument
