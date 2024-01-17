'use strict'

const util = require('util')
const Hashids = require('hashids')

const wait = util.promisify(setTimeout)

const CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
const SECONDARY_KEY_INDEX = 'secondaryKeyIndex'

module.exports = (Document, idKeyPrefix = '') =>
  class extends Document {
    static _createHashId(number) {
      const hashids = new Hashids(this.name, 0, CHARACTER_SET)
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

    static async _getNextNumber(partition, document) {
      const query = { partition, document }
      const options = { index: SECONDARY_KEY_INDEX, limit: 1, sort: 'desc' }

      const { items } = await this._index(query, options)
      const [lastItem] = items

      if (lastItem) {
        const { number = 0 } = lastItem
        return number + 1
      }

      return 1
    }

    static async _create(attributes) {
      let { partition, document, number } = attributes

      if (!partition) {
        partition = this.partition
        attributes.partition = this.partition
      }

      if (!document) {
        document = this.name
        attributes.document = this.documentName
      }

      if (!number) {
        number = await this._getNextNumber(partition, document)
      }

      attributes.number = number
      attributes[this.idKey] = this._createHashId(number)
      attributes.secondaryKey = attributes.createdAt

      try {
        const result = await super._create(attributes)
        return result
      } catch (error) {
        if (error.code === 'DocumentExistsError') {
          delete attributes.number
          await wait(25)
          await this._create(attributes)
        } else {
          throw error
        }
      }
    }
  }
