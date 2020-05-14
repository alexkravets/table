'use strict'

const {
  wait,
  expect,
  expectError,
  DynamoDocument,
  DynamoDocumentCustomPartitionKey } = require('./helpers')

before(async() => {
  await DynamoDocument.resetCollection()
  await DynamoDocumentCustomPartitionKey.resetCollection()

  await DynamoDocument._create({
    firstName:  'Stanislav',
    lastName:   'Kravets',
    parameters: {
      size:  1,
      tags:  [ 'tag2', 'tag4' ],
      shirt: { size: 'L' }
    },
    createdAt: new Date().toJSON()
  })

  await wait(50)

  await DynamoDocument._create({
    firstName:  'Alexander',
    lastName:   'Popovich',
    parameters: {
      size:  2,
      tags:  [ 'tag1' ],
      shirt: { size: 'L' }
    },
    createdAt: new Date().toJSON()
  })

  await wait(50)

  await DynamoDocument._create({
    firstName:  'Alexander',
    lastName:   'Shelest',
    parameters: {
      size:  3,
      tags:  [ 'tag2' ],
      shirt: { size: 'M' }
    },
    createdAt: new Date().toJSON()
  })

  await wait(50)

  await DynamoDocument._create({
    firstName:  'Alexander',
    lastName:   'Simonenkov',
    parameters: {
      size:  1,
      tags:  [ 'tag3' ],
      shirt: { size: 'XL' }
    },
    createdAt: new Date().toJSON()
  })

  await wait(50)

  await DynamoDocument._create({
    firstName:  'Alexander',
    lastName:   'Popov',
    parameters: {
      size:  2,
      tags:  [ 'tag3', 'tag4' ],
      shirt: { size: 'S' }
    },
    createdAt: new Date().toJSON()
  })

  await DynamoDocumentCustomPartitionKey._create({
    unit:      '1',
    lastName:  'Kravets',
    firstName: 'Alexander'
  })

  await DynamoDocumentCustomPartitionKey._create({
    unit:      '1',
    lastName:  'Simonenkov',
    firstName: 'Artem'
  })

  await DynamoDocumentCustomPartitionKey._create({
    unit:      '1',
    lastName:  'Popov',
    firstName: 'Denis'
  })

  await DynamoDocumentCustomPartitionKey._create({
    unit:      '2',
    lastName:  'Kravets',
    firstName: 'Alexander'
  })
})

it('returns docs, count', async() => {
  const { docs, count } = await DynamoDocument._index()

  expect(count).to.equal(5)
  expect(docs).to.have.lengthOf(5)

  const [ doc ] = docs
  expect(doc).to.include({
    firstName: 'Stanislav',
    lastName:  'Kravets'
  })
})

it('returns docs, count using composed sort key and consistent read', async() => {
  const { docs, count } = await DynamoDocumentCustomPartitionKey._index({
    unit: '1',
  }, { sort: 'asc', ConsistentRead: true })

  expect(count).to.equal(3)
  expect(docs).to.have.lengthOf(3)

  const [ kravets, popov, simonenkov ] = docs
  expect(kravets).to.include({
    lastName:  'Kravets',
    firstName: 'Alexander'
  })

  expect(popov).to.include({
    lastName:  'Popov',
    firstName: 'Denis'
  })

  expect(simonenkov).to.include({
    lastName:  'Simonenkov',
    firstName: 'Artem'
  })
})

it('returns docs, count and lastEvaluatedKey', async() => {
  const { docs, count, lastEvaluatedKey } = await DynamoDocument._index({}, { limit: 1 })

  expect(count).to.equal(1)
  expect(docs).to.have.lengthOf(1)
  expect(lastEvaluatedKey).to.be.not.empty
})

it('returns docs in ascending order', async() => {
  const { docs } = await DynamoDocument._index({}, { sort: 'asc' })
  const [ doc ]  = docs

  expect(doc.firstName).to.equal('Stanislav')
})

it('returns docs starting from exclusiveStartKey', async() => {
  const { lastEvaluatedKey: exclusiveStartKey } = await DynamoDocument._index({}, { limit: 4 })
  const { docs } = await DynamoDocument._index({}, { limit: 1, exclusiveStartKey })
  const [ doc ]  = docs

  expect(doc.firstName).to.equal('Alexander')
})

it.skip('returns docs filtered by query', async() => {
  const { docs, count, lastEvaluatedKey } = await DynamoDocument._index({ firstName: 'Alexander' }, { sort: 'asc', limit: 3 })
  const [ doc ] = docs

  expect(count).to.equal(3)
  expect(docs).to.have.lengthOf(3)
  expect(doc.firstName).to.equal('Alexander')
  expect(lastEvaluatedKey).to.equal(undefined)
})

it('supports query with attributes projection', async() => {
  const { docs } = await DynamoDocument._index({}, { limit: 1, projection: [ 'lastName', 'parameters.tags[1]' ] })
  const [ doc ]  = docs

  expect(doc.firstName).to.be.undefined
  expect(doc.lastName).to.equal('Kravets')
  expect(doc.parameters).not.to.be.undefined
  expect(doc.parameters.tags).not.to.be.undefined
  expect(doc.parameters.tags.length).to.equal(1)
  expect(doc.parameters.tags[0]).to.equal('tag4')
  expect(doc.parameters.shirt).to.be.undefined
})

it('supports query with nested attributes', async() => {
  const { docs, count } = await DynamoDocument._index({ 'parameters.shirt.size': 'L' }, { limit: 10 })
  const [ doc ] = docs

  expect(count).to.equal(2)
  expect(doc.parameters.shirt.size).to.equal('L')
})

it('supports IN queries for array values', async() => {
  const { count } = await DynamoDocument._index({ 'parameters.shirt.size': [ 'L', 'M' ] }, { limit: 10 })

  expect(count).to.equal(3)
})

it('supports :contains option in query', async() => {
  const { docs, count } = await DynamoDocument._index({ 'parameters.tags:contains': 'tag2' }, { limit: 2 })
  const [ doc ] = docs

  expect(count).to.equal(2)
  expect(doc.parameters.tags).to.include('tag2')
})

it('supports :not option in query', async() => {
  const { docs, count } = await DynamoDocument._index({ 'parameters.size:not': 2 })
  const [ doc1, doc2 ] = docs

  expect(count).to.equal(3)
  expect(doc1.parameters.size).not.equal(2)
  expect(doc2.parameters.tags).not.equal(2)
})

it('supports :gt option in query', async() => {
  const { docs, count } = await DynamoDocument._index({ 'parameters.size:gt': 2 })
  const [ doc ] = docs

  expect(count).to.equal(1)
  expect(doc.parameters.size).to.equal(3)
})

it('supports :lt option in query', async() => {
  const { docs, count } = await DynamoDocument._index({ 'parameters.size:lt': 2 })
  const [ doc ] = docs

  expect(count).to.equal(2)
  expect(doc.parameters.size).to.equal(1)
})

it('throws ValidationException if one of attributes is undefined', async() => {
  await expectError(() => DynamoDocument._index({ firstName: undefined }),
    'code', 'ValidationException')
})

it('throws Error if partition key is missing in query', async() => {
  await expectError(() => DynamoDocumentCustomPartitionKey._index(), 'message',
    'Query is missing partition key')
})

it('throws Error if missing index is provided via options', async() => {
  await expectError(() => DynamoDocumentCustomPartitionKey._index({}, {
    indexName: 'missingIndex'
  }), 'message', 'is not defined')
})

it('throws Error if table does not exist', async() => {
  await DynamoDocument.deleteCollection()
  await expectError(() => DynamoDocument._index({ firstName: 'Alexander' }),
    'message', 'Table storage-test-DynamoDocument doesn\'t exists')
})
