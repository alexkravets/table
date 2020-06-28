'use strict'

const { Table } = require('src')

describe('Table.constructor(options = {})', () => {
  it('initializes table with local and global indexes', async () => {
    const table = new Table({
      indexes: {
        createdIndex: {
          sortKey: 'createdAt'
        },
        updatedIndex: {
          sortKey: 'updatedAt'
        },
        userIndex: {
          partitionKey: 'userId',
          sortKey: 'createdAt'
        },
        companyIndex: {
          partitionKey: 'companyId'
        }
      }
    })

    await table.reset()
  })
})
