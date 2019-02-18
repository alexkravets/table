'use strict'

const {
  expect,
  expectError,
  DynamoDocument,
  DynamoDocumentCustomPartitionKey
} = require('./helpers')

let itemId
before(async() => {
  await DynamoDocument.resetCollection()
  await DynamoDocumentCustomPartitionKey.resetCollection()

  const attributes = {
    unit:      'UNIT_1',
    firstName: 'Stanislav',
    lastName:  'Kravets',
    parameters: {
      tags:  [ 'tag1', 'tag2' ],
      shirt: { size: 'L' }
    }
  }

  const Item = await DynamoDocument._create(attributes)
  itemId = Item.id
})

it('returns item via primaryKey', async() => {
  const item = await DynamoDocument._read({ id: itemId })
  expect(item.firstName).to.equal('Stanislav')
})

it('returns item via query', async() => {
  const item = await DynamoDocument._read({ firstName: 'Stanislav' })
  expect(item.firstName).to.equal('Stanislav')
})

it('returns item via query and custom index', async() => {
  const item = await DynamoDocument._read(
    { firstName: 'Stanislav', unit: 'UNIT_1' },
    { indexName: 'unitIndex' })

  expect(item.firstName).to.equal('Stanislav')
})

it('returns item with attributes projection', async() => {
  const item = await DynamoDocument._read({ id: itemId }, {
    projection: [ 'lastName', 'parameters.tags[1]' ]
  })

  expect(item.firstName).to.be.undefined
  expect(item.lastName).to.equal('Kravets')
  expect(item.parameters).not.to.be.undefined
  expect(item.parameters.tags).not.to.be.undefined
  expect(item.parameters.tags.length).to.equal(1)
  expect(item.parameters.tags[0]).to.equal('tag2')
  expect(item.parameters.shirt).to.be.undefined
})

it('throws ResourceNotFoundError if item is not found', async() => {
  await expectError(() => DynamoDocument._read({ id: 'ITEM_ID' }), 'code',
    'ResourceNotFoundError')
})

it('throws ResourceNotFoundError if item is not found by firstName', async() => {
  await expectError(() => DynamoDocument._read({ firstName: 'ITEM_ID' }), 'code',
    'ResourceNotFoundError')
})

it('throws ValidationException if ID is undefined in query', async() => {
  await expectError(() => DynamoDocument._read({ id: undefined }), 'code',
    'ValidationException')
})

it('throws Error if partition key is not defined in query', async() => {
  await expectError(() => DynamoDocumentCustomPartitionKey._read({ id: undefined }),
    'message', 'Query is missing partition key')
})

it('throws Error if table does not exist', async() => {
  await DynamoDocument.deleteCollection()
  await expectError(() => DynamoDocument._read({ id: 'ITEM_ID' }), 'message',
    'Table storage-test-DynamoDocument doesn\'t exists')
})
