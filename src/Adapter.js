'use strict'

const Table = require('./Table')
const filterItem = require('./helpers/filterItem')
const getTableOptions = require('./helpers/getTableOptions')

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

    static get documentName() {
      if (!this.name) {
        throw new Error('Document class name is undefined')
      }

      return this.name
    }

    static get partition() {
      return this.documentName
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

      } while (lastEvaluatedKey)

      const count = resultObjects.length

      return { objects: resultObjects, count }
    }

    static async _read(query, options = {}) {
      const { [this.idKey]: idValue, ...queryConditions } = query

      if (!idValue) {
        throw new Error(`Query missing ${this.idKey} parameter`)
      }

      const getItemQuery = this._getPartitionQuery(query)
      const item = await table.getItem(getItemQuery, options)

      return filterItem(item, queryConditions)
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
        ...query,
        [PARTITION_KEY]: this.partition,
      }
    }
  }
}

module.exports = Adapter
