'use strict'

const get = require('lodash.get')

const INDEX_QUERY_ID_PREFIX_KEY = 'id:bw'

module.exports = (Document, path = 'identity.organizationId') =>
  class extends Document {
    get _query() {
      const { idKey } = this.constructor

      const idValue = this.attributes[idKey]
      const partition = this.attributes.partition

      return {
        [idKey]: idValue,
        partition,
      }
    }

    static get documentName() {
      if (!this.name) {
        throw new Error('Document class name is undefined, define with "static get documentName()" method')
      }

      return this.name
    }

    static _getPartition(context, parameters) {
      const { partition } = parameters

      if (partition) {
        return partition
      }

      const contextPartition = get(context, path)

      if (!contextPartition) {
        throw Error(`Context is missing "${path}", partition is not defined`)
      }

      return contextPartition
    }

    static _extendIndexQueryWithIdPrefix(context, query, options) {
      const hasIndex = !!options.index
      const hasDefaultPrefix = this.idKeyPrefix === this.documentName
      const hasIdQueryDefined = !!query[INDEX_QUERY_ID_PREFIX_KEY]

      query.document = this.documentName

      if (!hasIndex) {
        query.partition = this._getPartition(context, query)
      }

      if (hasIndex) {
        return
      }

      if (hasDefaultPrefix) {
        return
      }

      if (hasIdQueryDefined) {
        return
      }

      query[INDEX_QUERY_ID_PREFIX_KEY] = this.idKeyPrefix
    }

    static async index(context, query, options = {}) {
      this._extendIndexQueryWithIdPrefix(context, query, options)
      return super.index(context, query, options)
    }

    static async create(context, query, mutation) {
      const parameters = mutation || query

      parameters.document = this.documentName
      parameters.partition = this._getPartition(context, parameters)

      return super.create(context, parameters)
    }

    static async read(context, query, options = {}) {
      query.document = this.documentName

      if (!options.index) {
        query.partition = this._getPartition(context, query)
      }

      return super.read(context, query, options)
    }

    static async update(context, query, mutation) {
      query.document = this.documentName
      query.partition = this._getPartition(context, query)

      return super.update(context, query, mutation)
    }

    static async delete(context, query) {
      query.document = this.documentName
      query.partition = this._getPartition(context, query)

      return super.delete(context, query)
    }
  }
