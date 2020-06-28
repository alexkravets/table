'use strict'

const Table = require('./Table')
// const { ulid }  = require('ulid')
// const cloneDeep = require('lodash.clonedeep')
// const ResourceExistsError = require('./errors/ResourceExistsError')
// const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const Adaptor = (Document, config) => {
  const table = new Table(config)

  return class extends Document {
    static get partitionKey() {
      return this.name
    }

    static async _create(attributes) {
      // attributes = cloneDeep(attributes)

      // attributes[this.idKey]  = this.documentId(attributes)
      // attributes.resourceName = this.resourceName

      await table.createItem(attributes)

      // const isCreated = await table.createItem(attributes)

      // if (!isCreated) {
      //   throw new ResourceExistsError(this.resourceName, { attributes })
      // }

      return attributes
    }

    // TODO: Looks like ResourceNotFoundError should be extracted to the
    //       Document level or Operation > Read level:
    // if (!item) {
    //   ResourceNotFoundError(this.resourceName, { query, options })
    // }

    static async _read(query, options) {
      return table.readItem(query, options)
    }

    static async _delete(query) {
      return table.deleteItem(query)
    }
  }
}

module.exports = Adaptor
