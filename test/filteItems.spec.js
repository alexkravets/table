'use strict'

const { Table } = require('src')
const filterItem = require('src/helpers/filterItem')
const { expect } = require('./helpers')

const partition = 'Profile'

describe('filterItems(item, conditionsMap)', () => {
  let table

  const id = 'ART'

  before(async () => {
    table = new Table()

    await table.reset()

    const attributes = {
      name: 'Artem',
      age: 33,
      pets: {
        cats: [ 'Mojo', 'Jojo' ]
      },
      id,
      partition
    }
    await table.createItem(attributes)
  })

  it('returns "undefined" if item is not provided', async () => {
    const item = undefined
    const result = filterItem(item, {})
    expect(result).to.be.undefined
  })

  it('supports :not filter', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'age:not': 0 })
    expect(result).to.exist
  })

  it('supports :not null filter', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'age:not': null })
    expect(result).to.exist
  })

  it('supports null filter', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'phone': null })
    expect(result).to.exist
  })

  it('supports :contains filter', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'pets.cats:contains': 'Mojo' })
    expect(result).to.exist
  })

  it('supports :not_contains filter', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'pets.cats:not_contains': 'Bojo' })
    expect(result).to.exist
  })

  it('supports :in filter', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'name': ['Artem', 'Alex'] })
    expect(result).to.exist
  })

  it('returns "undefined" for filtere item', async () => {
    const item = await table.getItem({ id, partition })
    const result = filterItem(item, { 'name': 'John' })
    expect(result).to.be.undefined
  })
})
