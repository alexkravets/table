'use strict'

const uuid        = require('uuid/v1')
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
  static documentId() {
    return uuid()
  }

  static get resourceName() {
    return this.name
  }

  static get tableName() {
    return `${tablePrefix}-${this.resourceName}`
  }

  static get indexes() {
    return []
  }

  static createCollection() {
    return createTable(rawClient, this.tableName, this.indexes)
  }

  static deleteCollection() {
    return rawClient.deleteTable({ TableName: this.tableName }).promise()
  }

  static async resetCollection() {
    try {
      await this.deleteCollection()

    } catch (error) {
      if (error.code != 'ResourceNotFoundException') {
        throw error

      }
    }

    await this.createCollection()
  }

  static async _create(attributes) {
    const timestamp = new Date().toJSON()

    attributes.id        = this.documentId(attributes)
    attributes.createdAt = timestamp
    attributes.updatedAt = timestamp
    attributes.resourceName = this.resourceName

    await createItem(client, this.resourceName, this.tableName, attributes)
    return attributes
  }

  static _read(query, options) {
    return readItem(client, this.resourceName, this.tableName, query, options)
  }

  static _delete(id) {
    return deleteItem(client, this.resourceName, this.tableName, id)
  }

  static _update(id, attributes) {
    const timestamp = new Date().toJSON()
    attributes.updatedAt = timestamp

    return updateItem(client, this.resourceName, this.tableName, id, attributes)
  }

  static async _index(query, options) {
    const { items: docs, ...rest } = await indexItems(client, this.resourceName, this.tableName, query, options)
    return { docs, ...rest }
  }
}

module.exports = Dynamo
