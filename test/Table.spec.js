'use strict'

const { Table }       = require('src')
const { expectError } = require('./helpers')

describe('Table', () => {
  describe('.reset()', () => {
    it('deletes existing table, creates new table', async () => {
      const table = new Table()
      await table.reset()
    })

    it('deletes existing table, creates new table with custom indexes', async () => {
      const table = new Table({
        indexes: {
          defaultIndex: {
            sortKey: 'createdAt'
          },
          recentIndex: {
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

  describe('.createItem(resourceName, attributes)', () => {
    let table

    before(async () => {
      table = new Table()
      await table.reset()
    })

    it('creates item', async () => {
      const attributes = { id: '1', name: 'Hello, world!', resourceName: 'Profile' }
      await table.createItem('Profile', attributes)
    })

    it('throws "ResourceExistsError" if item ID already taken', async () => {
      const attributes = { id: '1', name: 'Hello, world!', resourceName: 'Profile' }
      await expectError(
        () => table.createItem('Profile', attributes),
        'ResourceExistsError'
      )
    })

    it('throws "InvalidAttributesError" one of required attributes is undefined', async () => {
      const attributes = { id: '1', name: 'Hello, world!' }

      await expectError(
        () => table.createItem('Profile', attributes),
        'InvalidAttributesError'
      )
    })

    it('throws "TableNotFoundError" if table does not exist', async () => {
      await table.destroy()

      const attributes = { id: '1', name: 'Hello, world!', resourceName: 'Profile' }

      await expectError(
        () => table.createItem('Profile', attributes),
        'TableNotFoundError'
      )
    })
  })
})
