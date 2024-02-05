'use strict'

const get                    = require('lodash.get')
const { homedir }            = require('os')
const { fromIni }            = require('@aws-sdk/credential-providers')
const { existsSync }         = require('fs')
const { DynamoDBClient }     = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocument }   = require('@aws-sdk/lib-dynamodb')
const { DeleteTableCommand } = require('@aws-sdk/client-dynamodb')

const getItem     = require('./helpers/getItem')
const listItems   = require('./helpers/listItems')
const deleteItem  = require('./helpers/deleteItem')
const createItem  = require('./helpers/createItem')
const updateItem  = require('./helpers/updateItem')
const createError = require('./helpers/createError')
const createTable = require('./helpers/createTable')

const ROOT_PATH    = process.cwd()
const { name }     = require(`${ROOT_PATH}/package.json`)
const TABLE_PREFIX = name.replace('@', '').replace('/', '-')

const HOME            = homedir()
const INSTANCE        = process.env.NODE_APP_INSTANCE
const LOCAL_REGION    = 'local'
const LOCAL_ENDPOINT  = 'http://0.0.0.0:8000'
const DEFAULT_PROFILE = 'private'

const DEFAULT_INDEXES     = {}
/* istanbul ignore next */
const DEFAULT_TABLE_NAME  = INSTANCE ? `${TABLE_PREFIX}-${INSTANCE}` : TABLE_PREFIX
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
      config.credentials = fromIni({ profile })
    }

    const indexes    = get(options, 'indexes', DEFAULT_INDEXES)
    const tableName  = get(options, 'tableName', DEFAULT_TABLE_NAME)
    const primaryKey = get(options, 'primaryKey', DEFAULT_PRIMARY_KEY)

    this._rawClient = new DynamoDBClient(config)
    this._client    = DynamoDBDocument.from(this._rawClient)

    this._indexes      = indexes
    this._tableName    = tableName
    this._primaryKey   = primaryKey
    this._tableOptions = tableOptions
  }

  get primaryKey() {
    return this._primaryKey
  }

  get name() {
    return this._tableName
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
    const command = new DeleteTableCommand({ TableName })
    return this._client.send(command)
  }

  delete() {
    return this.destroy()
  }

  async reset() {
    try {
      await this.delete()

    } catch (error) {
      /* istanbul ignore next */
      if (error.name !== 'ResourceNotFoundException') {
        throw error
      }

    }

    await this.create()
  }

  getItem(query, options = {}) {
    const { key } = this._getKey('Get', query)

    return getItem(this._client, this._tableName, key, options)
  }

  createItem(attributes) {
    this._getKey('Create', attributes)

    return createItem(this._client, this._tableName, this._primaryKey, attributes)
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

    if (!isSecondaryLocalIndex) {
      return { ...indexKey }
    }

    return { ...indexKey, partitionKey: this._primaryKey.partitionKey }
  }

  _getKey(methodName, query, indexName) {
    const indexKey = this._getIndexKey(indexName)

    const { partitionKey, sortKey } = indexKey

    const {
      [sortKey]:      sortKeyValue,
      [partitionKey]: partitionKeyValue,
      ...conditionQuery
    } = query

    const hasKey = !!partitionKeyValue && !!sortKeyValue

    if (!hasKey) {
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
