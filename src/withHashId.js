'use strict'

const util = require('util')
const Hashids = require('hashids')

const wait = util.promisify(setTimeout)

const CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

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

      const { items } = await this._index(query, { limit: 1, sort: 'desc' })
      const [lastItem] = items

      if (lastItem) {
        const { number } = lastItem
        return number + 1
      }

      return 1
    }

    static async _create(attributes) {
      const { partition, document } = attributes

      const number = await this._getNextNumber(partition, document)

      attributes.number = number
      attributes[this.idKey] = this._createHashId(number)

      try {
        const result = await super._create(attributes)
        return result
      } catch (error) {
        if (error.code === 'DocumentExistsError') {
          await wait(25)
          await this._create(attributes)
        } else {
          throw error
        }
      }
    }
  }
