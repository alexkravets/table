'use strict'

const { Dynamo, AbstractDocument } = require('test/helpers')

class CollectionManagementExample extends Dynamo(AbstractDocument) {}

before(async() => {
  try {
    await CollectionManagementExample.deleteCollection()

  } catch (error) {
    console.log('Skip table delete for "CollectionManagementExample"')

  }
})

describe('Document.createCollection()', () => {
  it('creates DynamoDB table and indexes', async() => {
    await CollectionManagementExample.createCollection()
  })
})

describe('Document.deleteCollection()', () => {
  it('drops DynamoDB table and indexes', async() => {
    await CollectionManagementExample.deleteCollection()
  })
})

describe('Document.resetCollection()', () => {
  it('creates DynamoDB table and indexes', async() => {
    await CollectionManagementExample.resetCollection()
  })

  it('drops existing DynamoDB table and indexes and creates new ones', async() => {
    await CollectionManagementExample.resetCollection()
  })
})
