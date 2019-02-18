'use strict'

const uuid        = require('uuid/v4')
const config      = require('./config')
const readItem    = require('./readItem')
const indexItems  = require('./indexItems')
const createItem  = require('./createItem')
const deleteItem  = require('./deleteItem')
const updateItem  = require('./updateItem')
const createTable = require('./createTable')

const { AWS, options, tablePrefix } = config()
const client    = new AWS.DynamoDB.DocumentClient(options)
const rawClient = new AWS.DynamoDB(options)

const Dynamo = Document => class extends Document {
  static get dynamo() {
    return client
  }

  static get documentIdKey() {
    return 'id'
  }

  static documentId(attributes = {}) {
    const { documentIdKey } = this
    return attributes[documentIdKey] || uuid().replace(/-/g, '')
  }

  static get resourceName() {
    return this.name
  }

  static get tableName() {
    return `${tablePrefix}-${this.resourceName}`
  }

  static get tablePartitionKey() {
    return 'resourceName'
  }

  static get tableSortKey() {
    return this.documentIdKey
  }

  static get tablePrimaryKey() {
    const { tablePartitionKey: partitionKey, tableSortKey: sortKey } = this
    return { partitionKey, sortKey }
  }

  static get defaultIndex() {
    return { sortKey: 'createdAt' }
  }

  static get indexes() {
    return { defaultIndex: this.defaultIndex }
  }

  static createCollection() {
    return createTable(
      rawClient,
      this.tableName,
      this.tablePartitionKey,
      this.tableSortKey,
      this.indexes)
  }

  static deleteCollection() {
    return rawClient.deleteTable({ TableName: this.tableName }).promise()
  }

  static async resetCollection() {
    try {
      await this.deleteCollection()

    } catch (error) {
      /* istanbul ignore if: No need to simulate unexpected Dynamo errors */
      if (error.code !== 'ResourceNotFoundException') {
        throw error

      }
    }

    await this.createCollection()
  }

  static async _create(attributes) {
    const {
      tableName,
      documentId,
      resourceName,
      documentIdKey
    } = this

    const timestamp = new Date().toJSON()

    attributes.createdAt      = timestamp
    attributes.updatedAt      = timestamp
    attributes.resourceName   = resourceName
    attributes[documentIdKey] = documentId(attributes)

    await createItem(client, resourceName, documentIdKey, tableName, attributes)
    return attributes
  }

  static async _index(query = {}, options = {}) {
    const {
      indexes,
      tableName,
      resourceName,
      tablePrimaryKey,
      tablePartitionKey
    } = this

    const hasIndex = !!options.indexName
    const hasDefaultTablePartitionKey = tablePartitionKey === 'resourceName'

    if (!hasIndex) {
      if (hasDefaultTablePartitionKey) {
        query['resourceName'] = resourceName
      }

      if (indexes['defaultIndex']) {
        options.indexName = 'defaultIndex'
      }
    }

    const { items: docs, ...rest } = await indexItems(
      client,
      tableName,
      tablePrimaryKey,
      indexes,
      query,
      options
    )

    return { docs, ...rest }
  }

  static _read(query, options = {}) {
    const {
      indexes,
      tableName,
      resourceName,
      tablePrimaryKey,
      tablePartitionKey
    } = this

    const hasIndex = !!options.indexName
    const hasDefaultTablePartitionKey = tablePartitionKey === 'resourceName'

    if (!hasIndex) {
      if (hasDefaultTablePartitionKey) {
        query['resourceName'] = resourceName
      }
    }

    return readItem(client, tableName, tablePrimaryKey, indexes, query, options)
  }

  static _update(query, attributes) {
    const {
      tableName,
      resourceName,
      tablePrimaryKey,
      tablePartitionKey
    } = this

    const hasDefaultTablePartitionKey = tablePartitionKey === 'resourceName'

    if (hasDefaultTablePartitionKey) {
      query['resourceName'] = resourceName
    }

    const timestamp = new Date().toJSON()
    attributes.updatedAt = timestamp

    return updateItem(client, tableName, tablePrimaryKey, query, attributes)
  }

  static _delete(query) {
    const {
      tableName,
      resourceName,
      tablePrimaryKey,
      tablePartitionKey
    } = this

    const hasDefaultTablePartitionKey = tablePartitionKey === 'resourceName'

    if (hasDefaultTablePartitionKey) {
      query['resourceName'] = resourceName
    }

    return deleteItem(client, tableName, tablePrimaryKey, query)
  }
}

module.exports = Dynamo
