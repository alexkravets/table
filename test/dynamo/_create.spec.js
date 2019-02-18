'use strict'

const { DynamoDocument, expectError } = require('./helpers')

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

it('throws Error if table does not exist', async() => {
  await DynamoDocument.deleteCollection()

  const attributes = {
    firstName: 'Stanislav',
    lastName:  'Kravets'
  }

  await expectError(() => DynamoDocument._create(attributes), 'message',
    'Table storage-test-DynamoDocument doesn\'t exists')
})
