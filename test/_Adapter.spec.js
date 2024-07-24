'use strict'

const { Adapter } = require('src')
const { expect, expectError } = require('./helpers')

describe('Adapter = (Document, config, tableId)', () => {
  class Profile {}
  class Klass extends Adapter(Profile, {
    tables: {
      default: {
        indexes: {
          nameIndex: {
            sortKey: 'name'
          }
        }
      }
    }
  }, 'default') {}

  before(async () => {
    await Klass.table.reset()
  })

  const id = 'TEST'

  describe('.idKey', async () => {
    it('returns default sortKey', () => {
      expect(Klass.idKey).to.eql('id')
    })
  })

  describe('.documentName', async () => {
    it('returns document class name', () => {
      expect(Klass.documentName).to.eql('Klass')
    })

    it('throws error if document class name is undefined', () => {
      let UndefinedName = Adapter(Profile, {
        tables: {
          default: {
            indexes: {
              nameIndex: {
                sortKey: 'name'
              }
            }
          }
        }
      }, 'default')

      expect(() => UndefinedName.documentName).to.throw('Document class name is undefined')
    })
  })

  describe('._create(attributes)', () => {
    it('creates item', async () => {
      let isCreated

      isCreated = await Klass._create({ id, name: 'Hello, world!' })
      expect(isCreated).to.be.true

      isCreated = await Klass._create({ id: 'TEST_2', partition: 'Profile', name: 'Wonderful, world!' })
      expect(isCreated).to.be.true
    })
  })

  describe('._index(query = {}, options = {})', () => {
    it('returns items', async () => {
      let items

      items = await Klass._index()
      expect(items).to.exist

      items = await Klass._index({ partition: 'Profile' })
      expect(items).to.exist

      items = await Klass._index({ partition: 'Profile' }, { index: 'nameIndex', limit: Klass.INDEX_LIMIT_MAX })
      expect(items).to.exist
    })
  })

  describe('._read(query, options = {})', () => {
    it('returns item for ID request', async () => {
      const item = await Klass._read({ id })
      expect(item).to.exist
    })

    it('returns item for query request', async () => {
      const item = await Klass._read({ id, name: 'Hello, world!' })
      expect(item).to.exist
    })

    it('throws an error if id is not provided', async () => {
      const error = await expectError(() => Klass._read({ id: undefined }))
      expect(error.message).to.include('Query missing id parameter')
    })
  })

  describe('._update(query, attributes)', () => {
    it('updates item', async () => {
      const item = await Klass._update({ id }, { name: 'Bye, bye!' })
      expect(item.name).to.eql('Bye, bye!')
    })
  })

  describe('._delete(query)', () => {
    it('deletes item', async () => {
      await Klass._delete({ id })
    })
  })

  describe('.indexAll(context, query = {}, options = {})', () => {
    it('returns all items', async () => {
      const partition = 'ExtendedKlass'
      const itemsCount = 21

      class ExtendedKlass extends Klass {
        static get INDEX_LIMIT_MAX() {
          return 5
        }

        static async index(context, query = {}, options = {}) {
          let { items, ...rest } = await this._index(query, options)

          const objects = items.map(item => new this(context, item))

          return { objects, ...rest }
        }
      }

      const range = [...Array(itemsCount).keys()]

      for (const index of range) {
        await ExtendedKlass._create({
          id: `TEST_${index}`,
          name: `Count ${index}`,
          partition,
        })
      }

      const { objects } =
        await ExtendedKlass.indexAll({})

      const countItems = objects.length

      expect(countItems).to.eql(itemsCount)

      const { objects: objects2 } =
        await ExtendedKlass.indexAll({}, { partition }, { sort: 'asc'})

      const countItems2 = objects2.length

      expect(countItems2).to.eql(itemsCount)
    })
  })
})
