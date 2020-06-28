'use strict'

const get            = require('lodash.get')
const AWS            = require('aws-sdk')
const getItem        = require('./helpers/getItem')
const listItems      = require('./helpers/listItems')
const deleteItem     = require('./helpers/deleteItem')
const createItem     = require('./helpers/createItem')
const updateItem     = require('./helpers/updateItem')
const { homedir }    = require('os')
const createError    = require('./helpers/createError')
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

  get primaryKey() {
    return this._primaryKey
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
    this._getKey('Create', attributes)

    return createItem(this._client, this._tableName, this._primaryKey, attributes)
  }

  getItem(query, options = {}) {
    const { key, conditionQuery } = this._getKey('Get', query)

    return getItem(this._client, this._tableName, key, conditionQuery, options)
  }

  deleteItem(query) {
    const { key } = this._getKey('Delete', query)

    return deleteItem(this._client, this._tableName, key, query)
  }

  updateItem(query, attributes) {
    const { key } = this._getKey('Update', query)

    const { primaryKey, sortKey } = this._primaryKey
    delete attributes[sortKey]
    delete attributes[primaryKey]

    return updateItem(this._client, this._tableName, key, query, attributes)
  }

  listItems(query = {}, options = {}) {
    const { index: indexName, ...otherOptions } = options
    const indexKey = this._getIndexKey(indexName)

    return listItems(this._client, this._tableName, indexKey, query, { indexName, ...otherOptions })
  }

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

  _getKey(methodName, query, indexName) {
    const indexKey = this._getIndexKey(indexName)

    const { partitionKey, sortKey } = indexKey

    const {
      [sortKey]:      sortKeyValue,
      [partitionKey]: partitionKeyValue,
      ...conditionQuery
    } = query

    const isMissingKey = !!partitionKeyValue && !!sortKeyValue

    if (!isMissingKey) {
      const message = `Item method "${methodName}" requires "${partitionKey}"` +
        ` and "${sortKey}" to be defined in query`

      throw createError(message, { indexKey, query })
    }

    return {
      key: {
        [sortKey]:      sortKeyValue,
        [partitionKey]: partitionKeyValue
      },
      conditionQuery
    }
  }
}

module.exports = Table
