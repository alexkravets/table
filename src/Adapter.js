'use strict'

const Table = require('./Table')
const getTableOptions = require('./helpers/getTableOptions')

const UNDEFINED_PARTITION = 'UNDEFINED'

const Adapter = (Document, config, tableId) => {
  const options = getTableOptions(config, tableId)
  const table = new Table(options)

  const {
    sortKey:      ID_KEY,
    partitionKey: PARTITION_KEY,
  } = table.primaryKey

  return class extends Document {
    static get INDEX_LIMIT_MAX() {
      return 999
    }

    static get table() {
      return table
    }

    static get idKey() {
      return ID_KEY
    }

    static get partition() {
      return this.name || UNDEFINED_PARTITION
    }

    static _create(attributes) {
      const hasPartition = !!attributes[PARTITION_KEY]

      if (!hasPartition) {
        attributes[PARTITION_KEY] = this.partition
      }

      return table.createItem(attributes)
    }

    static _index(query = {}, options = {}) {
      query = this._getPartitionQuery(query, options.index)

      return table.listItems(query, options)
    }

    static async indexAll(context, query = {}, options = {}) {
      let resultObjects = []
      let lastEvaluatedKey
      let sort

      const limit = this.INDEX_LIMIT_MAX

      do {
        const operationOptions = { limit, ...options }

        if (lastEvaluatedKey) {
          operationOptions.exclusiveStartKey = lastEvaluatedKey
        }

        const { objects, lastEvaluatedKey: nextLastEvaluatedKey } =
          await this.index(context, query, operationOptions)

        resultObjects = [...resultObjects, ...objects]
        lastEvaluatedKey = nextLastEvaluatedKey

        const { sort: requestSort } = query
        sort = requestSort
      } while (lastEvaluatedKey)

      const count = resultObjects.length

      return { objects: resultObjects, count, sort }
    }

    static async _read(query, options = {}) {
      const { [this.idKey]: idValue, ...other } = query

      const hasIndex = !!options.index
      const hasOther = Object.keys(other).length > 0
      const isQuery  = hasIndex || hasOther

      if (isQuery) {
        const { items } = await this._index(query, { ...options, limit: 1 })
        return items[0]
      }

      query = this._getPartitionQuery({ [this.idKey]: idValue }, options.index)

      return table.getItem(query, options)
    }

    static _update(query, attributes) {
      query = this._getPartitionQuery(query)

      return table.updateItem(query, attributes)
    }

    static _delete(query) {
      query = this._getPartitionQuery(query)

      return table.deleteItem(query)
    }

    static _getPartitionQuery(query, indexName) {
      const hasIndex     = !!indexName
      const hasPartition = !!query[PARTITION_KEY]

      if (hasIndex) {
        return query
      }

      if (hasPartition) {
        return query
      }

      return {
        [PARTITION_KEY]: this.partition,
        ...query
      }
    }
  }
}

module.exports = Adapter
