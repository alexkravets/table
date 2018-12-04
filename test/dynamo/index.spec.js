'use strict'

const Dynamo     = require('lib/dynamo')
const { expect } = require('chai')

const expectError = async(fn, fieldName, value) => {
  try {
    await fn()

  } catch (error) {
    expect(error).to.have.property(fieldName, value)
    return

  }

  throw new Error('Expected exception has not been thrown')
}

const DynamoDocument = class extends Dynamo(class {}) {
  static documentId({ lastName }) {
    return lastName
  }

  static get errors() {
    return {
      ...super.errors,
      updatedAtIndex: { primaryKey: 'resourceName', sortKey: 'updatedAt' }
    }
  }
}

describe('Dynamo.dynamo', () => {
  it('returns DynamoDB client', () => {
    expect(DynamoDocument.dynamo).to.exist
  })
})

describe('Dynamo.documentId()', () => {
  it('returns UUID by default', () => {
    const Document = Dynamo(class {})
    const id = Document.documentId()
    expect(id).to.exist
  })
})

describe('Dynamo.resetCollection()', () => {
  it('throws error if can not delete collection', async() => {
    const Document = class extends Dynamo(class {}) {
      static async deleteCollection() {
        throw new Error('Connection error')
      }
    }

    await expectError(() => Document.resetCollection(), 'message',
      'Connection error')
  })
})

describe('Dynamo._create(attributes)', () => {
  before(async() => {
    await DynamoDocument.resetCollection()
  })

  it('creates item', async() => {
    await DynamoDocument._create({
      firstName: 'Alexander',
      lastName:  'Kravets'
    })
  })

  it('throws ResourceExistsError if item ID already taken', async() => {
    const attributes = {
      firstName: 'Stanislav',
      lastName:  'Kravets'
    }

    await expectError(() => DynamoDocument._create(attributes), 'code',
      'ResourceExistsError')
  })

  it('throws ValidationException one of required fields is undefined', async() => {
    const attributes = {
      firstName: 'Stanislav',
      lastName:  undefined
    }

    await expectError(() => DynamoDocument._create(attributes), 'code',
      'ValidationException')
  })

  it('throws error if table does not exist', async() => {
    await DynamoDocument.deleteCollection()

    const attributes = {
      firstName: 'Stanislav',
      lastName:  'Kravets'
    }

    await expectError(() => DynamoDocument._create(attributes), 'message',
      'Table storage-test-DynamoDocument doesn\'t exists')
  })
})

describe('Dynamo._read(query, options)', () => {
  let itemId
  before(async() => {
    await DynamoDocument.resetCollection()

    const attributes = {
      firstName: 'Stanislav',
      lastName:  'Kravets'
    }

    const Item = await DynamoDocument._create(attributes)
    itemId = Item.id
  })

  it('returns item', async() => {
    const item = await DynamoDocument._read({ id: itemId })
    expect(item.firstName).to.equal('Stanislav')
  })

  it('throws ResourceNotFoundError if item is not found', async() => {
    await expectError(() => DynamoDocument._read({ id: 'ITEM_ID' }), 'code',
      'ResourceNotFoundError')
  })

  it('throws ValidationException if ID is undefined', async() => {
    await expectError(() => DynamoDocument._read({ id: undefined }), 'code',
      'ValidationException')
  })

  it('throws error if table does not exist', async() => {
    await DynamoDocument.deleteCollection()
    await expectError(() => DynamoDocument._read({ id: 'ITEM_ID' }), 'message',
      'Table storage-test-DynamoDocument doesn\'t exists')
  })
})

describe('Dynamo._delete(id)', () => {
  let itemId
  before(async() => {
    await DynamoDocument.resetCollection()

    const attributes = {
      firstName: 'Stanislav',
      lastName:  'Kravets'
    }

    const Item = await DynamoDocument._create(attributes)
    itemId = Item.id
  })

  it('deletes item', async() => {
    await DynamoDocument._delete(itemId)
    await expectError(() => DynamoDocument._delete(itemId), 'code',
      'ResourceNotFoundError')
  })

  it('throws ResourceNotFoundError if item is not found', async() => {
    await expectError(() => DynamoDocument._delete('ITEM_ID'), 'code',
      'ResourceNotFoundError')
  })

  it('throws ValidationException if ID is undefined', async() => {
    await expectError(() => DynamoDocument._delete(), 'code',
      'ValidationException')
  })

  it('throws error if table does not exist', async() => {
    await DynamoDocument.deleteCollection()
    await expectError(() => DynamoDocument._delete('ITEM_ID'), 'message',
      'Table storage-test-DynamoDocument doesn\'t exists')
  })
})

describe('Dynamo._update(id, attributes)', () => {
  let itemId
  before(async() => {
    await DynamoDocument.resetCollection()

    const attributes = {
      firstName: 'Stanislav',
      lastName:  'Kravets',
      tags:      [ 'tag1' ]
    }

    const Item = await DynamoDocument._create(attributes)
    itemId = Item.id
  })

  it('updates item', async() => {
    const attributes = {
      firstName: 'Alexander'
    }

    const updatedItem = await DynamoDocument._update(itemId, attributes)
    expect(updatedItem.firstName).to.equal('Alexander')
  })

  it('supports :append operation', async() => {
    const attributes  = { 'tags:append': 'tag2' }
    const updatedItem = await DynamoDocument._update(itemId, attributes)

    expect(updatedItem.tags).to.include('tag2')
  })

  it('throws ResourceNotFoundError if :append already included value', async() => {
    const attributes = { 'tags:append': 'tag1' }
    await expectError(() => DynamoDocument._update(itemId, attributes),
      'code', 'ResourceNotFoundError')
  })

  it('throws ResourceNotFoundError if item is not found', async() => {
    const attributes = { firstName: 'Olga' }
    await expectError(() => DynamoDocument._update('ITEM_ID', attributes),
      'code', 'ResourceNotFoundError')
  })

  it('throws ValidationException if ID is undefined', async() => {
    await expectError(() => DynamoDocument._update(undefined, {}), 'code',
      'ValidationException')
  })

  it('throws error if table does not exist', async() => {
    await DynamoDocument.deleteCollection()
    await expectError(() => DynamoDocument._update('ITEM_ID', {}), 'message',
      'Table storage-test-DynamoDocument doesn\'t exists')
  })
})

describe('Dynamo._index(query, options)', () => {
  before(async() => {
    await DynamoDocument.resetCollection()

    await DynamoDocument._create({
      firstName:  'Stanislav',
      lastName:   'Kravets',
      parameters: {
        tags:  [ 'tag2' ],
        shirt: { size: 'L' }
      }
    })

    await DynamoDocument._create({
      firstName:  'Alexander',
      lastName:   'Popovich',
      parameters: {
        tags:  [ 'tag1' ],
        shirt: { size: 'L' }
      }
    })

    await DynamoDocument._create({
      firstName:  'Alexander',
      lastName:   'Shelest',
      parameters: {
        tags:  [ 'tag2' ],
        shirt: { size: 'M' }
      }
    })

    await DynamoDocument._create({
      firstName:  'Alexander',
      lastName:   'Simonenkov',
      parameters: {
        tags:  [ 'tag3' ],
        shirt: { size: 'XL' }
      }
    })

    await DynamoDocument._create({
      firstName:  'Alexander',
      lastName:   'Popov',
      parameters: {
        tags:  [ 'tag3' ],
        shirt: { size: 'S' }
      }
    })
  })

  it('returns docs, count', async() => {
    const { docs, count } = await DynamoDocument._index()

    expect(count).to.equal(5)
    expect(docs).to.have.lengthOf(5)
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

    expect(doc.firstName).to.equal('Stanislav')
  })

  it('returns docs filtered by query', async() => {
    const { docs, count, lastEvaluatedKey } = await DynamoDocument._index({ firstName: 'Alexander' }, { sort: 'asc', limit: 3 })
    const [ doc ] = docs

    expect(count).to.equal(3)
    expect(docs).to.have.lengthOf(3)
    expect(doc.firstName).to.equal('Alexander')
    expect(lastEvaluatedKey).to.equal(undefined)
  })

  it('supports query with nested attributes', async() => {
    const { docs, count } = await DynamoDocument._index({ 'parameters.shirt.size': 'L' }, { limit: 10 })
    const [ doc ] = docs

    expect(count).to.equal(2)
    expect(doc.parameters.shirt.size).to.equal('L')
  })

  it('does IN queries for array values', async() => {
    const { count } = await DynamoDocument._index({ 'parameters.shirt.size': [ 'L', 'M' ] }, { limit: 10 })

    expect(count).to.equal(3)
  })

  it('supports :contains option in query', async() => {
    const { docs, count } = await DynamoDocument._index({ 'parameters.tags:contains': 'tag2' }, { limit: 2 })
    const [ doc ] = docs

    expect(count).to.equal(2)
    expect(doc.parameters.tags).to.include('tag2')
  })

  it('throws ValidationException if one of attributes is undefined', async() => {
    await expectError(() => DynamoDocument._index({ firstName: undefined }),
      'code', 'ValidationException')
  })

  it('throws error if table does not exist', async() => {
    await DynamoDocument.deleteCollection()
    await expectError(() => DynamoDocument._index({ firstName: 'Alexander' }),
      'message', 'Table storage-test-DynamoDocument doesn\'t exists')
  })
})
