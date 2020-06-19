'use strict'

const {
  expectError,
  DynamoDocument,
  DynamoDocumentCustomPartitionKey } = require('./helpers')

let itemId

before(async() => {
  await DynamoDocument.resetCollection()
  await DynamoDocumentCustomPartitionKey.resetCollection()

  const attributes = {
    firstName: 'Stanislav',
    lastName:  'Kravets'
  }

  const Item = await DynamoDocument._create(attributes)
  itemId = Item.id
})

it('deletes item', async() => {
  await DynamoDocument._delete({ id: itemId })
  await expectError(() => DynamoDocument._delete({ id: itemId }), 'code',
    'ResourceNotFoundError')
})

it('throws ResourceNotFoundError if item is not found', async() => {
  await expectError(() => DynamoDocument._delete({ id: 'ITEM_ID' }), 'code',
    'ResourceNotFoundError')
})

it('throws ResourceNotFoundError if item is not found due to condition', async() => {
  const query = { id: itemId, firstName: 'Sergiy' }
  await expectError(() => DynamoDocument._delete(query), 'code',
    'ResourceNotFoundError')
})

it('throws Error if ID is not defined in query', async() => {
  await expectError(() => DynamoDocument._delete({}), 'message',
    'Query is missing primary key attributes')
})

it('throws Error if partition key is not defined in query', async() => {
  await expectError(() => DynamoDocumentCustomPartitionKey._delete({}, {}), 'message',
    'Query is missing primary key attributes')
})

it('throws Error if table does not exist', async() => {
  await DynamoDocument.deleteCollection()
  await expectError(() => DynamoDocument._delete({ id: 'ITEM_ID' }), 'message',
    'Table storage-test-DynamoDocument doesn\'t exists')
})
