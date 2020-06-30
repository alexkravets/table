#!/usr/bin/env node

'use strict'

const get    = require('lodash.get')
const Table  = require('../src/Table')
const config = require('config')

const TABLES = config.get('tables', {})

const _getTableOptions = tableId => {
  const config  = TABLES[tableId]
  const region  = get(config, 'aws.region')
  const profile = get(config, 'aws.profile')

  if (region) {
    config.region = region
  }

  if (profile) {
    config.profile = profile
  }

  return config
}

const _action = async (methodName) => {
  for (const tableId in TABLES) {
    const config = _getTableOptions(tableId)

    const table = new Table(config)
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
