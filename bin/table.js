#!/usr/bin/env node

'use strict'

const command = process.argv[2]
const isInvalidCommand = ![ 'up', 'create', 'delete', 'reset' ].includes(command)

if (isInvalidCommand) {
  console.info('table [create|delete|reset] [ENV=dev|stg|prd]\n')
  console.info('Commands:')
  console.info('  create     Create tables defined in configuration')
  console.info('  delete     Delete tables defined in "/config/default.yaml"')
  console.info('  reset      Reset tables defined in "/config/default.yaml"')
  console.info('\nDefault configuration file: "/config/default.yaml".')

  process.exit(1)
}

const env = process.argv[3]

if (env) {
  process.env.NODE_ENV = 'serverless'
  process.env.NODE_APP_INSTANCE = env
}

const { get }  = require('lodash')
const Table    = require('../src/Table')
const config   = require('config')
const { exec } = require('child_process')
const getTableOptions = require('../src/helpers/getTableOptions')

const tables = get(config, 'tables', { default: {} })

const _action = async (methodName) => {
  for (const tableId in tables) {
    const options = getTableOptions(config, tableId)

    const table = new Table(options)
    const { name: tableName } = table

    try {
      await table[methodName]()
      console.info(`Table "${tableName}" ${methodName}d`)

    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.info(`Table "${tableName}" skipped`)

      } else if (error.name === 'ResourceNotFoundException') {
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

const run = async callback => {
  if (env) {
    return callback()
  }

  const command = exec('docker compose -f node_modules/@kravc/table/docker-compose.yaml up -d', callback)
  command.stdout.on('data', data => console.log(data))
  command.stderr.on('data', data => console.error(data))
}

const COMMANDS = { create: _create, delete: _delete, reset: _reset }

run(() => COMMANDS[command]())
