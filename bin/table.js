#!/usr/bin/env node

'use strict'

const Table  = require('../src/Table')
const config = require('config')
const getTableOptions = require('../src/helpers/getTableOptions')

const tables = config.get('tables', {})

const _action = async (methodName) => {
  for (const tableId in tables) {
    const options = getTableOptions(config, tableId)

    const table = new Table(options)
    const { name: tableName } = table

    try {
      await table[methodName]()
      console.info(`Table "${tableName}" ${methodName}d`)

    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.info(`Table "${tableName}" skipped`)

      } else if (error.code === 'ResourceNotFoundException') {
        console.info(`Table "${tableName}" not found`)

      } else {
        console.error(error)
        process.exit(1)

      }
    }
  }
}

const _create = () => _action('create')
const _delete = () => _action('delete')

const _reset = async () => {
  await _delete()
  await _create()
}

const COMMANDS = { create: _create, delete: _delete, reset: _reset }

const command = process.argv[2]
const isInvalidCommand = ![ 'up', 'create', 'delete', 'reset' ].includes(command)

if (isInvalidCommand) {
  console.info('table [up|create|delete|reset]\n')
  console.info('Commands:')
  console.info('  up         Ensure Docker and DynamoDB container are up')
  console.info('  create     Create tables defined in configuration')
  console.info('  delete     Delete tables defined in "/config/default.yaml"')
  console.info('  reset      Reset tables defined in "/config/default.yaml"')
  console.info('\nDefault configuration file: "/config/default.yaml".')

  process.exit(1)
}

COMMANDS[command]()
