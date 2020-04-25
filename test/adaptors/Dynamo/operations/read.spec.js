'use strict'

const { expect, expectError, Dynamo, AbstractDocument } = require('test/helpers')

class ReadOperationExample extends Dynamo(AbstractDocument) {
  static get indexes() {
    return {
      ...super.indexes,
      ageIndex: {
        sortKey: 'age'
      }
    }
  }
}

// TODO: Check on how we deal with numbers as a index sort key:
describe('Document.read(query, options)', () => {
  let id
  const attributes = { name: 'Oleksandr Kravets', age: '32' }

  before(async() => {
    await ReadOperationExample.resetCollection()

    const doc = await ReadOperationExample.create(attributes)

    id = doc.id
  })

  it('returns a document by ID', async() => {
    const doc = await ReadOperationExample.read({ id })

    expect(doc).to.include(attributes)
    expect(doc.id).to.eql(id)
  })

  it('returns a document by query', async() => {
    const doc = await ReadOperationExample.read({ age: '32' })

    expect(doc).to.include(attributes)
    expect(doc.id).to.eql(id)
  })

  it('returns a document by query on index', async() => {
    const doc = await ReadOperationExample.read({ age: '32' }, { index: 'age' })

    expect(doc).to.include(attributes)
    expect(doc.id).to.eql(id)
  })

  it('throws "ResourceNotFoundError" if document not found by ID', async() => {
    const error = await expectError(() => ReadOperationExample.read({ id: 'BAD_ID' }))

    expect(error.code).to.eql('ResourceNotFoundError')
  })

  it('throws "ResourceNotFoundError" if document not found by query on index', async() => {
    const error = await expectError(() => ReadOperationExample.read({ age: 32 }, { index: 'age' }))

    expect(error.code).to.eql('ResourceNotFoundError')
  })

  it('throws "CollectionNotFoundError" if table does not exist', async() => {
    await ReadOperationExample.deleteCollection()

    const error = await expectError(() => ReadOperationExample.read({ id }))
    expect(error).to.include({ code: 'CollectionNotFoundError' })
    expect(error.context).to.include({ tableName: ReadOperationExample.tableName })
  })
})
