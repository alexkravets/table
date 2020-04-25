'use strict'

const { expect, expectError, Dynamo, AbstractDocument } = require('test/helpers')

class UpdateOperationExample extends Dynamo(AbstractDocument) {
  static get indexes() {
    return {
      ...super.indexes,
      ageIndex: {
        sortKey: 'age'
      }
    }
  }
}

describe('Document.update(query, attributes)', () => {
  let id
  const attributes = { name: 'Oleksandr Kravets', age: '32' }

  before(async() => {
    await UpdateOperationExample.resetCollection()

    const doc = await UpdateOperationExample.create(attributes)

    id = doc.id
  })

  it('updates a document by id', async() => {
    const age = '30'
    const doc = await UpdateOperationExample.update({ id }, { age })

    expect(doc.age).to.eql(age)
  })

  it('throws "InvalidAttributesError" if partition key or id key to be updated', async() => {
    let error

    error = await expectError(() => UpdateOperationExample.update({ id }, { resourceName: 'Error' }))
    expect(error.code).to.eql('InvalidAttributesError')

    error = await expectError(() => UpdateOperationExample.update({ id }, { id: 'NEW_ID' }))
    expect(error.code).to.eql('InvalidAttributesError')
  })

  it('throws "ResourceNotFoundError" if document not found by ID', async() => {
    const error = await expectError(() => UpdateOperationExample.update({ id: 'BAD_ID' }, { age: '32' }))

    expect(error.code).to.eql('ResourceNotFoundError')
  })

  it('throws "CollectionNotFoundError" if table does not exist', async() => {
    await UpdateOperationExample.deleteCollection()

    const error = await expectError(() => UpdateOperationExample.update({ id }, { age: '31' }))
    expect(error).to.include({ code: 'CollectionNotFoundError' })
    expect(error.context).to.include({ tableName: UpdateOperationExample.tableName })
  })
})
