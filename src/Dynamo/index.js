'use strict'

const config       = require('./helpers/config')
const readItem     = require('./operations/readItem')
const cloneDeep    = require('lodash.clonedeep')
const indexItems   = require('./operations/indexItems')
const createItem   = require('./operations/createItem')
const deleteItem   = require('./operations/deleteItem')
const updateItem   = require('./operations/updateItem')
const { v4: uuid } = require('uuid')
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

  static _getQueryKey(indexName) {
    if (!indexName) { return this.tablePrimaryKey }

    const { indexes, tableName, tablePartitionKey } = this

    const tableKey = indexes[indexName]

    if (!tableKey) {
      throw new Error(`Index "${tableName}.${indexName}" is not defined`)
    }

    return { tableName, indexName, partitionKey: tablePartitionKey, ...tableKey }
  }

  static _cloneQuery(query, partitionKey = this.tablePartitionKey) {
    query = cloneDeep(query)

    const isDefaultPartitionKey = partitionKey === 'resourceName'

    if (!isDefaultPartitionKey) {
      return query
    }

    return { resourceName: this.resourceName, ...query }
  }

  static _cloneAttributes(attributes) {
    return cloneDeep(attributes)
  }

  static async _create(attributes) {
    const {
      tableName,
      resourceName,
      documentIdKey,
      tablePartitionKey
    } = this
    attributes = this._cloneAttributes(attributes)

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

    const queryKey = this._getQueryKey(indexName)
    query = this._cloneQuery(query, queryKey.partitionKey)

    const { items: docs, ...rest } = await indexItems(client, queryKey, query, options)

    return { docs, ...rest }
  }

  static _read(query, options = {}) {
    const queryKey = this._getQueryKey(options.indexName)
    query = this._cloneQuery(query, queryKey.partitionKey)

    return readItem(client, queryKey, query, options)
  }

  static _update(query, attributes) {
    const queryKey = this._getQueryKey()

    query      = this._cloneQuery(query)
    attributes = this._cloneAttributes(attributes)

    return updateItem(client, queryKey, query, attributes)
  }

  static _delete(query) {
    const queryKey = this._getQueryKey()
    query = this._cloneQuery(query)

    return deleteItem(client, queryKey, query)
  }

  get _getQuery() {
    const query = super._getQuery

    const { tablePartitionKey } = this.constructor
    query[tablePartitionKey] = this.attributes[tablePartitionKey]

    return query
  }
}

module.exports = Dynamo
