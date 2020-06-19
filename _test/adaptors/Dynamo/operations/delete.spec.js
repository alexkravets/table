'use strict'

const { expect, expectError, Dynamo, AbstractDocument } = require('test/helpers')

class DeleteOperationExample extends Dynamo(AbstractDocument) {
}

describe('Document.delete(query)', () => {
  let id

  before(async() => {
    await DeleteOperationExample.resetCollection()

    await DeleteOperationExample.create({ name: 'Stanislav Kravets' })
    const doc = await DeleteOperationExample.create({ name: 'Oleksandr Kravets' })

    id = doc.id
  })

  it('deletes a document by ID', async() => {
    await DeleteOperationExample.delete({ id })

    const error = await expectError(() => DeleteOperationExample.read({ id }))
    expect(error).to.include({ code: 'ResourceNotFoundError' })
  })

  it('throws "ResourceNotFoundError" if document is not found by ID', async() => {
    const error = await expectError(() => DeleteOperationExample.delete({ id: 'BAD_ID' }))
    expect(error).to.include({ code: 'ResourceNotFoundError' })
  })

  it('throws "ResourceNotFoundError" if document is not found by additional condition', async() => {
    const error = await expectError(() => DeleteOperationExample.delete({ id, name: 'Stanislav Kravets' }))
    expect(error).to.include({ code: 'ResourceNotFoundError' })
  })

  it('throws "InvalidQueryError" if missing partition key or id key attribute', async() => {
    const error = await expectError(() => DeleteOperationExample.delete({ otherKey: 'TEST' }))
    expect(error).to.include({ code: 'InvalidQueryError' })
  })

  it('throws "CollectionNotFoundError" if table does not exist', async() => {
    await DeleteOperationExample.deleteCollection()

    const error = await expectError(() => DeleteOperationExample.delete({ id }))
    expect(error).to.include({ code: 'CollectionNotFoundError' })
    expect(error.context).to.include({ tableName: DeleteOperationExample.tableName })
  })
})
