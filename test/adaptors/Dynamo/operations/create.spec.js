'use strict'

const { expect, expectError, Dynamo, AbstractDocument } = require('test/helpers')

class CreateOperationExample extends Dynamo(AbstractDocument) {
  static documentId(attributes) {
    if (attributes.shouldThrowError) { return }

    return super.documentId(attributes)
  }
}

describe('Document.create(attributes)', () => {
  before(async() => {
    await CreateOperationExample.resetCollection()
  })

  it('creates a document', async() => {
    const { id } = await CreateOperationExample.create({ name: 'Oleksandr Kravets' })

    const doc = await CreateOperationExample.read({ id })

    expect(doc.id).to.exist
    expect(doc.name).to.exist
    expect(doc.updatedAt).to.exist
    expect(doc.createdAt).to.exist
    expect(doc.resourceName).to.exist
  })

  it('throws "ResourceExistsError" if ID is already taken', async() => {
    const { id } = await CreateOperationExample.create({ name: 'Oleksandr Kravets' })
    const attributes = { name: 'Stanislav Kravets', id }

    const error = await expectError(() => CreateOperationExample.create(attributes))
    expect(error).to.include({ code: 'ResourceExistsError' })
    expect(error.context).to.include({ id })
  })

  it('throws "InvalidAttributesError" if missing partition key or id key attribute', async() => {
    const attributes = { name: 'Stanislav Kravets', shouldThrowError: true }

    const error = await expectError(() => CreateOperationExample.create(attributes))
    expect(error).to.include({ code: 'InvalidAttributesError' })
  })

  it('throws "ValidationException" if invalid attribute type', async() => {
    const id = [ 'INVALID_ID_ATTRIBUTE_TYPE' ]

    const attributes = { id, name: 'Stanislav Kravets' }

    const error = await expectError(() => CreateOperationExample.create(attributes))
    expect(error).to.include({ code: 'ValidationException' })
  })

  it('throws "CollectionNotFoundError" if table does not exist', async() => {
    await CreateOperationExample.deleteCollection()

    const attributes = { name: 'Stanislav Kravets' }

    const error = await expectError(() => CreateOperationExample.create(attributes))
    expect(error).to.include({ code: 'CollectionNotFoundError' })
    expect(error.context).to.include({ tableName: CreateOperationExample.tableName })
  })
})
