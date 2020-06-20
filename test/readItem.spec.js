'use strict'

const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const resourceName = 'Profile'

describe('table.readItem(attributes, options = {})', () => {
  let table

  const id = 'LISA'

  before(async () => {
    table = new Table()
    await table.reset()

    const attributes = {
      name: 'Lisa',
      pets: {
        cats: [ 'Bonya', 'Zoe' ]
      },
      id,
      resourceName
    }
    await table.createItem(attributes)
  })

  it('returns item', async () => {
    const item = await table.readItem({ id, resourceName })
    expect(item).to.exist
  })

  it('returns item with projected attributes', async () => {
    const item = await table.readItem({ id, resourceName }, {
      projection: [ 'name', 'pets.cats[1]' ],
      consistentRead: true
    })

    expect(item.id).to.not.exist
    expect(item.resourceName).to.not.exist
    expect(item.name).to.eql('Lisa')
    expect(item.pets.cats).to.have.lengthOf(1)
    expect(item.pets.cats).to.include('Zoe')
  })

  it('returns "undefined" if not found', async () => {
    const item = await table.readItem({ id: 'NONE', resourceName })
    expect(item).to.be.undefined
  })

  it('throws "TableNotFoundError" if table not found', async () => {
    await table.destroy()

    const error = await expectError(() => table.readItem({ id, resourceName }))
    expect(error).to.include({ code: 'TableNotFoundError' })
  })
})
