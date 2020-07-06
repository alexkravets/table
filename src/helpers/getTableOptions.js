'use strict'

const get = require('lodash.get')

const getTableOptions = (config, tableId) => {
  const tables = get(config, 'tables', {})
  const tableOptions = JSON.parse(JSON.stringify(tables[tableId]))

  const region  = get(config, 'aws.region', 'local')
  const profile = get(config, 'aws.profile', 'private')

  tableOptions.region  = region
  tableOptions.profile = profile

  return tableOptions
}

module.exports = getTableOptions
