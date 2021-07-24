'use strict'

const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const partition = 'Profile'

describe('table.updateItem(query, attributes)', () => {
  let table

  const id = 'OLYA'

  before(async () => {
    table = new Table()
    await table.reset()

    const attributes = {
      name: 'Olya',
      size: 'XL',
      pets: {
        cats: [ 'Bonya', 'Zoe' ],
        dogs: [ 'Jessy' ],
        status: 'Happy'
      },
      id,
      partition
    }
    await table.createItem(attributes)
  })

  it('returns updated item', async () => {
    const item = await table.updateItem({ id, partition }, {
      name:                'Jenny',
      'pets.status':       'Neutral',
      'pets.cats:append':  'Tony',
      'pets.dogs:prepend': 'Stark'
    })

    expect(item).to.be.exist
    expect(item.name).to.eql('Jenny')
    expect(item.pets.status).to.eql('Neutral')
    expect(item.pets.dogs[0]).to.eql('Stark')
    expect(item.pets.cats[2]).to.eql('Tony')
  })

  it('removes items attribute', async () => {
    const item = await table.updateItem({ id, partition }, {
      size: null
    })

    expect(item).to.be.exist
    expect(item.size).to.not.exist
  })

  it('updates item list element by index', async () => {
    const item = await table.updateItem({ id, partition }, {
      'pets.dogs[0]': 'Bob'
    })

    expect(item).to.be.exist
    expect(item.pets.dogs[0]).to.eql('Bob')
  })

  it('returns "false" if item not found', async () => {
    const isUpdate = await table.updateItem({ id: 'NONE', partition }, { name: 'Jenny' })
    expect(isUpdate).to.be.false
  })

  it('throws error if table not found', async () => {
    await table.destroy()

    const error = await expectError(() => table.updateItem({ id, partition }, { name: 'Jenny' }))
    expect(error.message).to.include('Table "kravc-table-test" does not exist')
  })
})
