'use strict'

const get         = require('lodash.get')
const AWS         = require('aws-sdk')
const createItem  = require('./helpers/createItem')
const { homedir } = require('os')
const createTable = require('./helpers/createTable')
const { existsSync } = require('fs')

const HOME            = homedir()
const LOCAL_REGION    = 'local'
const LOCAL_ENDPOINT  = 'http://0.0.0.0:8000'
const DEFAULT_PROFILE = 'private'

const DEFAULT_PRIMARY_KEY = {
  tableName:    'default',
  partitionKey: 'resourceName',
  sortKey:      'id'
}

const DEFAULT_INDEXES = {}

const hasAwsCredentials = existsSync(`${HOME}/.aws/credentials`)

class Table {
  constructor(options = {}) {
    const tableOptions = {}

    const config = {
      region: get(options, 'region', LOCAL_REGION)
    }

    const isLocal = config.region === LOCAL_REGION

    /* istanbul ignore else */
    if (isLocal) {
      config.endpoint = LOCAL_ENDPOINT

      tableOptions.ProvisionedThroughput = {
        ReadCapacityUnits:  1,
        WriteCapacityUnits: 1
      }

    } else {
      tableOptions.BillingMode = 'PAY_PER_REQUEST'

    }

    /* istanbul ignore else */
    if (hasAwsCredentials) {
      const profile = get(options, 'profile', DEFAULT_PROFILE)
      config.credentials = new AWS.SharedIniFileCredentials({ profile })
    }

    const indexes    = get(options, 'indexes', DEFAULT_INDEXES)
    const primaryKey = get(options, 'primaryKey', DEFAULT_PRIMARY_KEY)

    this._client    = new AWS.DynamoDB.DocumentClient(config)
    this._rawClient = new AWS.DynamoDB(config)

    this._indexes      = indexes
    this._primaryKey   = primaryKey
    this._tableOptions = tableOptions
  }

  create() {
    return createTable(
      this._rawClient,
      this._primaryKey,
      this._indexes,
      this._tableOptions
    )
  }

  destroy() {
    const TableName = 'default'
    return this._rawClient.deleteTable({ TableName }).promise()
  }

  async reset() {
    try {
      await this.destroy()

    } catch (error) {
      /* istanbul ignore next */
      if (error.code !== 'ResourceNotFoundException') {
        throw error

      }
    }

    await this.create()
  }

  async createItem(resourceName, attributes) {
    await createItem(this._client, this._primaryKey, resourceName, attributes)

    return attributes
  }

  // async indexItems(resourceName, query = {}, options = {}) {
  //   let { indexName } = options
  //   const hasDefaultIndex = !!this.indexes.defaultIndex

  //   if (!indexName && hasDefaultIndex) { indexName = 'defaultIndex' }

  //   const queryKey = this._getQueryKey(indexName)
  //   query = this._cloneQuery(query, queryKey.partitionKey)

  //   const { items, ...rest } = await indexItems(client, queryKey, query, options)

  //   return { items, ...rest }
  // }

  // readItem(resourceName, query, options = {}) {
  //   const queryKey = this._getQueryKey(options.indexName)
  //   query = this._cloneQuery(query, queryKey.partitionKey)

  //   return readItem(client, queryKey, query, options)
  // }

  // updateItem(resourceName, query, attributes) {
  //   const queryKey = this._getQueryKey()

  //   query      = this._cloneQuery(query)
  //   attributes = cloneDeep(attributes)

  //   return updateItem(client, queryKey, query, attributes)
  // }

  // deleteItem(resourceName, query) {
  //   const queryKey = this._getQueryKey()
  //   query = this._cloneQuery(query)

  //   return deleteItem(client, queryKey, query)
  // }

  // static _getQueryKey(indexName) {
  //   if (!indexName) { return this.tablePrimaryKey }

  //   const { indexes, tableName, tablePartitionKey } = this

  //   const tableKey = indexes[indexName]

  //   if (!tableKey) {
  //     throw new Error(`Index "${tableName}.${indexName}" is not defined`)
  //   }

  //   return { tableName, indexName, partitionKey: tablePartitionKey, ...tableKey }
  // }

  // static _cloneQuery(query, partitionKey = this.tablePartitionKey) {
  //   query = cloneDeep(query)

  //   const isDefaultPartitionKey = partitionKey === 'resourceName'

  //   if (!isDefaultPartitionKey) {
  //     return query
  //   }

  //   return { resourceName: this.resourceName, ...query }
  // }

  // get _getQuery() {
  //   const query = super._getQuery

  //   const { tablePartitionKey } = this.constructor
  //   query[tablePartitionKey] = this.attributes[tablePartitionKey]

  //   return query
  // }
}

module.exports = Table
