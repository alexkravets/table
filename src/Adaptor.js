'use strict'

const Table = require('./Table')

const Adaptor = (Document, config) => {
  const table = new Table(config)

  const {
    sortKey:      ID_KEY,
    partitionKey: PARTITION_KEY,
  } = table.primaryKey

  return class extends Document {
    static get table() {
      return table
    }

    static get idKey() {
      return ID_KEY
    }

    static get partition() {
      return this.name
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

    static _read(query, options = {}) {
      query = this._getPartitionQuery(query, options.index)

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

module.exports = Adaptor
