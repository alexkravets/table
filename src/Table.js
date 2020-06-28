'use strict'

const get            = require('lodash.get')
const AWS            = require('aws-sdk')
const omit           = require('lodash.omit')
const getItem        = require('./helpers/getItem')
const buildKey       = require('./helpers/buildKey')
const listItems      = require('./helpers/listItems')
const deleteItem     = require('./helpers/deleteItem')
const createItem     = require('./helpers/createItem')
const updateItem     = require('./helpers/updateItem')
const { homedir }    = require('os')
const createTable    = require('./helpers/createTable')
const { existsSync } = require('fs')

const ROOT_PATH = process.cwd()
const { name }  = require(`${ROOT_PATH}/package.json`)
const tablePrefix = name.replace('@', '').replace('/', '-')

const HOME            = homedir()
const LOCAL_REGION    = 'local'
const LOCAL_ENDPOINT  = 'http://0.0.0.0:8000'
const DEFAULT_PROFILE = 'private'

const DEFAULT_INDEXES     = {}
const DEFAULT_TABLE_NAME  = `${tablePrefix}-${process.env.NODE_ENV}`
const DEFAULT_PRIMARY_KEY = {
  partitionKey: 'partition',
  sortKey:      'id'
}

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
    const tableName  = get(options, 'tableName', DEFAULT_TABLE_NAME)
    const primaryKey = get(options, 'primaryKey', DEFAULT_PRIMARY_KEY)

    this._client    = new AWS.DynamoDB.DocumentClient(config)
    this._rawClient = new AWS.DynamoDB(config)

    this._indexes      = indexes
    this._tableName    = tableName
    this._primaryKey   = primaryKey
    this._tableOptions = tableOptions
  }

  create() {
    return createTable(
      this._rawClient,
      this._tableName,
      this._primaryKey,
      this._indexes,
      this._tableOptions
    )
  }

  destroy() {
    const TableName = this._tableName
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

  createItem(attributes) {
    this._verifyKey('Create', attributes)

    return createItem(this._client, this._tableName, this._primaryKey, attributes)
  }

  readItem(query, options = {}) {
    const key = this._getKey('Get', query)

    return getItem(this._client, this._tableName, key, query, options)
  }

  deleteItem(query) {
    const key = this._getKey('Delete', query)

    // TODO: Verify requirement for omit function:
    const { partitionKey } = this._primaryKey
    query = omit(query, [ partitionKey ])

    return deleteItem(this._client, this._tableName, key, query)
  }

  updateItem(query, attributes) {
    const key = this._getKey('Delete', query)

    // TODO: Verify requirement for omit function:
    const { partitionKey } = this._primaryKey
    query = omit(query, [ partitionKey ])

    return updateItem(this._client, this._tableName, key, query, attributes)

    // const { resourceName, partitionKey, idKey } = queryKey

    // const shouldUpdatePartitionKey = !!attributes[partitionKey]
    // const shouldUpdateId = !!attributes[idKey]

    // if (shouldUpdatePartitionKey) {
    //   const message = `Update of partition key "${partitionKey}" for` +
    //     ` "${resourceName}" is restricted`

    //   throw new InvalidAttributesError(message, { queryKey, query, attributes })
    // }

    // if (shouldUpdateId) {
    //   throw new InvalidAttributesError(
    //     `Update of ID key "${idKey}" for "${resourceName}" is restricted`,
    //     { queryKey, query, attributes })
    // }
  }

  listItems(query = {}, options = {}) {
    const { index: indexName, ...otherOptions } = options
    const indexKey = this._getIndexKey(indexName)

    return listItems(this._client, this._tableName, indexKey, query, { indexName, ...otherOptions })
  }

  // ---

  // TODO: This should auto-detect index based on attributes:
  _getIndexKey(indexName) {
    let indexKey = this._primaryKey

    if (indexName) {
      indexKey = this._indexes[indexName]
    }

    if (!indexKey) {
      throw new Error(`Index "${this._tableName}.${indexName}" is not defined`)
    }

    const isSecondaryLocalIndex = !indexKey.partitionKey

    if (isSecondaryLocalIndex) {
      indexKey.partitionKey = this._primaryKey.partitionKey
    }

    return indexKey
  }

  _getKey(methodName, attributes, indexName) {
    const indexKey = this._getIndexKey(indexName)

    return buildKey(methodName, indexKey, attributes)
  }

  _verifyKey(...params) {
    this._getKey(...params)
  }
}

module.exports = Table
