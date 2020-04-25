'use strict'

const {
  expect,
  expectError,
  DynamoDocument,
  DynamoDocumentCustomPartitionKey
} = require('./helpers')

let itemId
let itemId2

before(async() => {
  await DynamoDocument.resetCollection()
  await DynamoDocumentCustomPartitionKey.resetCollection()

  const attributes = {
    firstName: 'Stanislav',
    lastName:  'Kravets',
    tags:      [ 'tag1' ],
    parameters: {
      nestedTags: [ 'nestedTag1' ],
      size: 'L'
    }
  }

  const Item = await DynamoDocument._create(attributes)
  itemId = Item.id

  const attributes2 = {
    firstName: 'Stanislav',
    lastName:  'Kravets',
    unit:      '1'
  }

  const Item2 = await DynamoDocumentCustomPartitionKey._create(attributes2)
  itemId2 = Item2.id
})

it('updates item', async() => {
  const attributes = {
    firstName: 'Alexander'
  }

  const updatedItem = await DynamoDocument._update({ id: itemId }, attributes)
  expect(updatedItem.firstName).to.equal('Alexander')

  const updatedItem2 =
    await DynamoDocumentCustomPartitionKey._update({ id: itemId2 }, { ...attributes, unit: '1' })
  expect(updatedItem2.firstName).to.equal('Alexander')
})

it('supports :append operation', async() => {
  const attributes  = { 'parameters.nestedTags:append': 'nestedTag2' }
  const updatedItem = await DynamoDocument._update({ id: itemId }, attributes)

  expect(updatedItem.parameters.nestedTags).to.include('nestedTag2')
})

it('supports :prepend operation', async() => {
  const attributes  = { 'parameters.nestedTags:prepend': 'nestedTag0' }
  const updatedItem = await DynamoDocument._update({ id: itemId }, attributes)

  expect(updatedItem.parameters.nestedTags[0]).to.equal('nestedTag0')
})

it('throws ResourceNotFoundError if :append already included value', async() => {
  const attributes = { 'tags:append': 'tag1' }
  await expectError(() => DynamoDocument._update({ id: itemId }, attributes),
    'code', 'ResourceNotFoundError')
})

it('supports update with nested attributes', async() => {
  const attributes  = { 'parameters.size': 'XL' }
  const updatedItem = await DynamoDocument._update({ id: itemId }, attributes)

  expect(updatedItem.parameters.size).to.equal('XL')
})

it('supports update with array item', async() => {
  const attributes  = { 'tags[0]': 'tag2' }
  const updatedItem = await DynamoDocument._update({ id: itemId }, attributes)

  expect(updatedItem.tags[0]).to.equal('tag2')
})

it('supports update with nested attributes array item', async() => {
  const attributes  = { 'parameters.nestedTags[0]': 'nestedTag2' }
  const updatedItem = await DynamoDocument._update({ id: itemId }, attributes)

  expect(updatedItem.parameters.nestedTags[0]).to.equal('nestedTag2')
})

it('throws ResourceNotFoundError if item is not found', async() => {
  const attributes = { firstName: 'Olga' }
  await expectError(() => DynamoDocument._update({ id: 'BAD_ID' }, attributes),
    'code', 'ResourceNotFoundError')
})

it('throws ResourceNotFoundError if item is not found due to condition', async() => {
  const query      = { id: itemId, firstName: 'Sergiy' }
  const attributes = { firstName: 'Olga' }

  await expectError(() => DynamoDocument._update(query, attributes),
    'code', 'ResourceNotFoundError')
})

it('throws Error if ID is not defined in query', async() => {
  await expectError(() => DynamoDocument._update({}, {}), 'message',
    'Query is missing primary key attributes')
})

it('throws Error if partition key is not defined in query', async() => {
  await expectError(() => DynamoDocumentCustomPartitionKey._update({}, {}), 'message',
    'Query is missing primary key attributes')
})

it('throws Error if table does not exist', async() => {
  await DynamoDocument.deleteCollection()
  await expectError(() => DynamoDocument._update({ id: 'ITEM_ID' }, {}), 'message',
    'Table storage-test-DynamoDocument doesn\'t exists')
})
