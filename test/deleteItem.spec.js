'use strict'

const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const resourceName = 'Profile'

describe('table.deleteItem(attributes)', () => {
  let table

  const id = 'SONAY'

  before(async () => {
    table = new Table()
    await table.reset()

    const attributes = {
      name: 'Sonya',
      id,
      resourceName
    }
    await table.createItem(attributes)
  })

  it('returns "true" if item deleted', async () => {
    const isDeleted = await table.deleteItem({ id, resourceName })
    expect(isDeleted).to.be.true

    const item = await table.readItem({ id, resourceName })
    expect(item).to.not.exist
  })

  // TODO: Add tests with conditions:
  // TODO: Test deletion via index:

  it('returns "false" if item not found', async () => {
    const isDeleted = await table.deleteItem({ id: 'NONE', resourceName })
    expect(isDeleted).to.be.false
  })

  it('throws "TableNotFoundError" if table not found', async () => {
    await table.destroy()

    const error = await expectError(() => table.deleteItem({ id, resourceName }))
    expect(error).to.include({ code: 'TableNotFoundError' })
  })
})
