'use strict'

const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const TABLE_OPTIONS = {
  indexes: {
    defaultLocalIndex: {
      sortKey: 'createdAt'
    },
    recentLocalIndex: {
      sortKey: 'updatedAt'
    },
    userGlobalIndex: {
      partitionKey: 'userId',
      sortKey: 'createdAt'
    },
    companyGlobalIndex: {
      partitionKey: 'companyId'
    }
  }
}

const resourceName = 'Profile'

describe('table.createItem(attributes)', () => {
  let table

  before(async () => {
    table = new Table(TABLE_OPTIONS)
    await table.reset()
  })

  const id = '1'

  it('returns "true" if item created', async () => {
    const attributes = { id, resourceName, name: 'Hello, world!' }

    const isCreated = await table.createItem(attributes)
    expect(isCreated).to.be.true
  })

  it('returns "false" if item not created', async () => {
    const attributes = { id, resourceName, name: 'Hello, world!' }

    const isCreated = await table.createItem(attributes)
    expect(isCreated).to.be.false
  })

  it('throws "InvalidItemKeyError" one of required attributes is undefined', async () => {
    const attributes = { id, name: 'Hello, world!' }

    const error = await expectError(() => table.createItem(attributes))
    expect(error).to.include({ code: 'InvalidItemKeyError' })
  })

  it('throws "TableNotFoundError" if table not found', async () => {
    await table.destroy()

    const attributes = { id, resourceName, name: 'Hello, world!' }

    const error = await expectError(() => table.createItem(attributes))
    expect(error).to.include({ code: 'TableNotFoundError' })
  })
})
