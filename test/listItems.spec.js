'use strict'

const { ulid }  = require('ulid')
const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const partition = 'Profile'

const LIMIT = 20

describe('table.listItems(query = {}, options = {})', () => {
  let table

  before(async () => {
    table = new Table({
      indexes: {
        nameIndex: {
          sortKey: 'name'
        }
      }
    })

    await table.reset()

    for (const index of [ ...Array(LIMIT + 1).keys() ]) {
      const id         = ulid()
      const isEnabled  = index <= 15
      const attributes = { partition, id, name: `Name-${index}`, isEnabled }
      await table.createItem(attributes)
    }
  })

  it('returns items with pagination parameters', async () => {
    let result

    result = await table.listItems({ partition }, { limit: LIMIT, consistentRead: true })

    expect(result).to.exist
    expect(result.count).to.eql(LIMIT)
    expect(result.items).to.have.lengthOf(LIMIT)
    expect(result.lastEvaluatedKey).to.exist

    const exclusiveStartKey = result.lastEvaluatedKey

    result = await table.listItems({ partition }, { limit: LIMIT, exclusiveStartKey })

    expect(result).to.exist
    expect(result.count).to.eql(1)
    expect(result.items).to.have.lengthOf(1)
    expect(result.lastEvaluatedKey).to.not.exist
  })

  it('returns items via local index', async () => {
    const result = await table.listItems({ partition }, {
      sort:  'desc',
      limit: 5,
      index: 'nameIndex'
    })

    expect(result).to.exist
    expect(result.items[0].name).to.eql('Name-9')
    expect(result.items[4].name).to.eql('Name-5')
  })

  it('returns filtered items in descending order', async () => {
    const result = await table.listItems({ partition, isEnabled: true }, { limit: LIMIT / 2, sort: 'desc' })

    expect(result).to.exist
    expect(result.count).to.eql(LIMIT / 2)
    expect(result.items).to.have.lengthOf(LIMIT / 2)
    expect(result.lastEvaluatedKey).to.exist
    expect(result.items[0].name).to.eql('Name-15')
  })

  it('returns filtered items via local index with projection', async () => {
    const result = await table.listItems({ partition, name: 'Name-20', isEnabled: false }, {
      limit:          1,
      index:          'nameIndex',
      projection:     [ 'name', 'isEnabled' ],
      consistentRead: true
    })

    expect(result).to.exist
    expect(result.items).to.have.lengthOf(1)
    expect(result.items[0].name).to.eql('Name-20')
  })

  it('throws error if index not found', async () => {
    const error = await expectError(() => table.listItems({ partition }, { index: 'BAD_INDEX' }))
    expect(error.message).to.include('Index "kravc-table-test.BAD_INDEX" is not defined')
  })

  it('throws error if no partition key in query', async () => {
    const error = await expectError(() => table.listItems())
    expect(error.message).to.include('Item method "Query" requires "partition"')
  })

  it('throws error if table not found', async () => {
    await table.destroy()

    const error = await expectError(() => table.listItems({ partition }))
    expect(error.message).to.include('Table "kravc-table-test" does not exist')
  })
})
