'use strict'

const Table     = require('./Table')
const { ulid }  = require('ulid')
const cloneDeep = require('lodash.clonedeep')

const Dynamo = (config, Document) => {
  const table = new Table(config)

  return class extends Document {
    static get idPrefix() {
      return this.resourceName
    }

    static documentId(attributes = {}) {
      if (attributes[this.idKey]) {
        return attributes[this.idKey]
      }

      const id           = ulid()
      const { idPrefix } = this

      return `${idPrefix}_${id}`
    }

    static _create(attributes) {
      attributes = cloneDeep(attributes)

      attributes[this.idKey]  = this.documentId(attributes)
      attributes.resourceName = this.resourceName

      return table.createItem(this.resourceName, attributes)
    }

    // get _getQuery() {
    //   const query = super._getQuery

    //   const { tablePartitionKey } = this.constructor
    //   query[tablePartitionKey] = this.attributes[tablePartitionKey]

    //   return query
    // }
  }
}

module.exports = Dynamo
