'use strict'

const Table   = require('./Table')
const Adapter = require('./Adapter')
const withHashId = require('./withHashId')
const withPartition = require('./withPartition')

module.exports = {
  Table,
  Adapter,
  withHashId,
  withPartition
}
