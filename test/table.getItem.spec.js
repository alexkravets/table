'use strict'

const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const partition = 'Profile'

describe('table.getItem(attributes, options = {})', () => {
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
      partition
    }
    await table.createItem(attributes)
  })

  it('returns item', async () => {
    const item = await table.getItem({ id, partition })
    expect(item).to.exist
  })

  it('returns item with projected attributes', async () => {
    const item = await table.getItem({ id, partition }, {
      projection: [ 'name', 'pets.cats[1]' ],
      consistentRead: true
    })

    expect(item.id).to.not.exist
    expect(item.partition).to.not.exist
    expect(item.name).to.eql('Lisa')
    expect(item.pets.cats).to.have.lengthOf(1)
    expect(item.pets.cats).to.include('Zoe')
  })

  it('returns "undefined" if not found', async () => {
    const item = await table.getItem({ id: 'NONE', partition })
    expect(item).to.be.undefined
  })

  it('throws error if table not found', async () => {
    await table.destroy()

    const error = await expectError(() => table.getItem({ id, partition }))
    expect(error.message).to.include('Table "kravc-table-test" does not exist')
  })
})
