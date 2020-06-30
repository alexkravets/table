'use strict'

const { expect }  = require('./helpers')
const { Adaptor } = require('src')

describe('Adaptor = (Document, config)', () => {
  let Klass

  before(async () => {
    class Profile {}
    Klass = Adaptor(Profile, {
      indexes: {
        nameIndex: {
          sortKey: 'name'
        }
      }
    })

    await Klass.table.reset()
  })

  const id = 'TEST'

  describe('.idKey', async () => {
    it('returns default sortKey', () => {
      expect(Klass.idKey).to.eql('id')
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

      items = await Klass._index({ partition: 'Profile' }, { index: 'nameIndex' })
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
})
