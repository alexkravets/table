'use strict'

const { Table } = require('src')
const { config, expect, expectError } = require('./helpers')

const partition = 'Profile'

describe('table.createItem(attributes)', () => {
  let table

  before(async () => {
    table = new Table(config)
    await table.reset()
  })

  const id = '1'

  it('returns "true" if item created', async () => {
    const attributes = { id, partition, name: 'Hello, world!' }

    const isCreated = await table.createItem(attributes)
    expect(isCreated).to.be.true
  })

  it('returns "false" if item not created', async () => {
    const attributes = { id, partition, name: 'Hello, world!' }

    const isCreated = await table.createItem(attributes)
    expect(isCreated).to.be.false
  })

  it('throws error if one of required attributes is undefined', async () => {
    const attributes = { id, name: 'Hello, world!' }

    const error = await expectError(() => table.createItem(attributes))
    expect(error.message).to.include('Item method "Create" requires "partition"')
  })

  it('throws error if table not found', async () => {
    await table.destroy()

    const attributes = { id, partition, name: 'Hello, world!' }

    const error = await expectError(() => table.createItem(attributes))
    expect(error.message).to.include('Table "kravc-table-test" does not exist')
  })
})
