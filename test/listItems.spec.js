'use strict'

const { ulid }  = require('ulid')
const { Table } = require('src')
const { expect, expectError } = require('./helpers')

const resourceName = 'Profile'

const LIMIT = 20

describe('table.listItems(query = {}, options = {})', () => {
  let table

  before(async () => {
    table = new Table()
    await table.reset()

    for (const index of [ ...Array(LIMIT + 1).keys() ]) {
      const id         = ulid()
      const isEnabled  = index <= 15
      const attributes = { resourceName, id, name: `Name-${index}`, isEnabled }
      await table.createItem(attributes)
    }
  })

  it('returns items with pagination parameters', async () => {
    let result

    result = await table.listItems({ resourceName }, { limit: LIMIT, consistentRead: true })

    expect(result).to.exist
    expect(result.count).to.eql(LIMIT)
    expect(result.items).to.have.lengthOf(LIMIT)
    expect(result.lastEvaluatedKey).to.exist

    const exclusiveStartKey = result.lastEvaluatedKey

    result = await table.listItems({ resourceName }, { limit: LIMIT, exclusiveStartKey })

    expect(result).to.exist
    expect(result.count).to.eql(1)
    expect(result.items).to.have.lengthOf(1)
    expect(result.lastEvaluatedKey).to.not.exist
  })

  it('returns filtered items in descending order', async () => {
    const result = await table.listItems({ resourceName, isEnabled: true }, { limit: LIMIT / 2, sort: 'desc' })

    expect(result).to.exist
    expect(result.count).to.eql(LIMIT / 2)
    expect(result.items).to.have.lengthOf(LIMIT / 2)
    expect(result.lastEvaluatedKey).to.exist
    expect(result.items[0].name).to.eql('Name-15')
  })

  it('throws "InvalidQueryError" if no partition key in query', async () => {
    const error = await expectError(() => table.listItems())
    expect(error).to.include({ code: 'InvalidQueryError' })
  })

  it('throws "TableNotFoundError" if table not found', async () => {
    await table.destroy()

    const error = await expectError(() => table.listItems({ resourceName }))
    expect(error).to.include({ code: 'TableNotFoundError' })
  })
})
