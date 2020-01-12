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
    lastName:  'Kravets',
    firstName: 'Stanislav',
    createdAt: new Date().toJSON(),
    parameters: {
      tags:  [ 'tag1', 'tag2' ],
      shirt: { size: 'L' }
    }
  }

  const Item = await DynamoDocument._create(attributes)
  itemId = Item.id
})

it('returns item via primaryKey in a consistent way', async() => {
  const item = await DynamoDocument._read({ id: itemId }, {
    ConsistentRead: true
  })

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

it('returns item via sort key and custom index', async() => {
  const { createdAt } = await DynamoDocument._read({ id: itemId })

  const item = await DynamoDocument._read({ createdAt }, { indexName: 'defaultIndex' })
  expect(item.id).to.eql(itemId)
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

it('returns first item if query is empty', async() => {
  const item = await DynamoDocument._read({})

  expect(item.firstName).to.equal('Stanislav')
  expect(item.lastName).to.equal('Kravets')
})

it('throws ResourceNotFoundError if item is not found', async() => {
  await expectError(() => DynamoDocument._read({ id: 'ITEM_ID' }), 'code',
    'ResourceNotFoundError')
})

it('throws ResourceNotFoundError if item is not found by firstName', async() => {
  await expectError(() => DynamoDocument._read({ firstName: 'ITEM_ID' }), 'code',
    'ResourceNotFoundError')
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
