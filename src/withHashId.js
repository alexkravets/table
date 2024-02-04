'use strict'

const util = require('util')
const Hashids = require('hashids')

const wait = util.promisify(setTimeout)

const SORT_DESC = 'desc'
const CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
const SECONDARY_KEY = 'secondaryKey'

module.exports = (Document, idKeyPrefix = '') =>
  class extends Document {
    static get secondaryKeyIndex() {
      return `${SECONDARY_KEY}Index`
    }

    /* NOTE: For default index operation use secondary index to query items
             using secondary key. */
    static _index(query, options) {
      const extendedQuery = {
        [`${SECONDARY_KEY}:bw`]: this.documentName,
        ...query
      }

      const extendedOptions = { ...options }

      if (!options.index) {
        extendedOptions.index = this.secondaryKeyIndex
      }

      return super._index(extendedQuery, extendedOptions)
    }

    static _createHashId(document, number) {
      const hashids = new Hashids(document, 0, CHARACTER_SET)
      const hashId = hashids.encode(number)

      if (idKeyPrefix) {
        return `${idKeyPrefix}${hashId}`
      }

      idKeyPrefix = this.idKeyPrefix
      const hasCustomIdKeyPrefix = this.idKeyPrefix !== this.documentName

      if (hasCustomIdKeyPrefix) {
        return `${idKeyPrefix}_${hashId}`
      }

      return hashId
    }

    static async _getNextNumber(partition) {
      const query = { partition }
      const options = { limit: 1, sort: SORT_DESC }

      const { items } = await this._index(query, options)
      const [lastItem] = items

      if (lastItem) {
        const { number = 0 } = lastItem
        return number + 1
      }

      return 1
    }

    static async _create(attributes) {
      let { partition, document, number, createdAt } = attributes

      if (!partition) {
        partition = this.partition
        attributes.partition = this.partition
      }

      if (!document) {
        document = this.documentName
        attributes.document = this.documentName
      }

      if (!number) {
        number = await this._getNextNumber(partition)
      }

      attributes.number = number
      attributes[this.idKey] = this._createHashId(document, number)
      attributes.secondaryKey = `${document}_${createdAt}`

      const isCreated = await super._create(attributes)

      if (isCreated) {
        return true
      }

      await wait(50)

      attributes.number = null
      return this._create(attributes)
    }
  }
