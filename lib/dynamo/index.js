'use strict'

const uuid       = require('uuid/v4')
const config     = require('./helpers/config')
const readItem   = require('./operations/readItem')
const indexItems = require('./operations/indexItems')
const createItem = require('./operations/createItem')
const deleteItem = require('./operations/deleteItem')
const updateItem = require('./operations/updateItem')
const createTableSchema = require('./helpers/createTableSchema')

const { AWS, options, tablePrefix } = config()
const client    = new AWS.DynamoDB.DocumentClient(options)
const rawClient = new AWS.DynamoDB(options)

const Dynamo = Document => class extends Document {
  static get dynamo() {
    return client
  }

  static documentId(attributes = {}) {
    return attributes[this.documentIdKey] || uuid().replace(/-/g, '')
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
    return {
      isPrimary:    true,
      tableName:    this.tableName,
      partitionKey: this.tablePartitionKey,
      sortKey:      this.tableSortKey
    }
  }

  static get indexes() {
    if (!this.defaultIndexSortKey) { return {} }

    return {
      defaultIndex: {
        sortKey: this.defaultIndexSortKey
      }
    }
  }

  static createCollection() {
    const tableSchema = createTableSchema(this.tablePrimaryKey, this.indexes)
    return rawClient.createTable(tableSchema).promise()
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

  static _getTableKey(indexName) {
    if (!indexName) { return this.tablePrimaryKey }

    const { indexes, tableName, tablePartitionKey } = this

    const tableKey = indexes[indexName]

    if (!tableKey) {
      throw new Error(`Index "${tableName}.${indexName}" is not defined`)
    }

    return { tableName, partitionKey: tablePartitionKey, ...tableKey }
  }

  static _extendQueryDefaults(query, partitionKey = this.tablePartitionKey) {
    const isDefaultPartitionKey = partitionKey === 'resourceName'

    if (!isDefaultPartitionKey) {
      return query
    }

    return { resourceName: this.resourceName, ...query }
  }

  static async _create(attributes) {
    const {
      tableName,
      resourceName,
      documentIdKey,
      tablePartitionKey
    } = this
    attributes[documentIdKey] = this.documentId(attributes)

    const hasDefaultTablePartitionKey = tablePartitionKey === 'resourceName'
    if (hasDefaultTablePartitionKey) {
      attributes.resourceName = resourceName
    }

    await createItem(client, resourceName, documentIdKey, tableName, attributes)
    return attributes
  }

  static async _index(query = {}, options = {}) {
    let { indexName } = options
    const hasDefaultIndex = !!this.indexes.defaultIndex

    if (!indexName && hasDefaultIndex) { indexName = 'defaultIndex' }

    const tableKey = this._getTableKey(indexName)
    query = this._extendQueryDefaults(query, tableKey.partitionKey)

    const { items: docs, ...rest } = await indexItems(client, tableKey, query, options)

    return { docs, ...rest }
  }

  static _read(query, options = {}) {
    const tableKey = this._getTableKey(options.indexName)
    query = this._extendQueryDefaults(query, tableKey.partitionKey)

    return readItem(client, tableKey, query, options)
  }

  static _update(query, attributes) {
    const tableKey = this.tablePrimaryKey
    query = this._extendQueryDefaults(query)

    return updateItem(client, tableKey, query, attributes)
  }

  static _delete(query) {
    const tableKey = this.tablePrimaryKey
    query = this._extendQueryDefaults(query)

    return deleteItem(client, tableKey, query)
  }
}

module.exports = Dynamo
