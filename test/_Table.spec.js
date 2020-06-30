'use strict'

const { Table }  = require('src')
const { expect } = require('./helpers')

describe('Table', () => {
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

  describe('.name', () => {
    it('returns table name', async () => {
      const table = new Table()
      expect(table.name).to.exist
    })
  })
})
