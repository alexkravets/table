'use strict'

const omit = require('lodash.omit')

class AbstractDocument {
  static get documentIdKey() {
    return 'id'
  }

  static get defaultIndexSortKey() {
    return 'createdAt'
  }

  static async create(attributes) {
    const timestamp = new Date().toJSON()
    attributes.createdAt = timestamp
    attributes.updatedAt = timestamp

    return this._create(attributes)
  }

  static index(query = {}, options = {}) {
    return this._index(query, options)
  }

  static read(query, options) {
    return this._read(query, options)
  }

  static async update(query, attributes) {
    attributes = omit(attributes, [
      'createdAt',
      'createdBy'
    ])

    const timestamp = new Date().toJSON()
    attributes.updatedAt = timestamp

    return this._update(query, attributes)
  }

  static async delete(query) {
    return this._delete(query)
  }

  delete() {
    return this.constructor.delete(this.context, this._getQuery)
  }

  async update(attributes, shouldMutate = false) {
    const updatedDoc = await this.constructor.update(this.context, this._getQuery, attributes)

    if (shouldMutate) {
      this._attributes = updatedDoc.attributes
    }

    return updatedDoc
  }

  get _getQuery() {
    const query = {}

    const { documentIdKey } = this.constructor
    query[documentIdKey] = this.attributes[documentIdKey]

    return query
  }
}

module.exports = AbstractDocument
