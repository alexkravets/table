'use strict'

describe.only('Adaptors', () => {
  require('./adaptors')
})

describe('Errors', () => {
  require('./errors/ResourceUpdateError.spec')
})

describe('Dynamo', () => {
  describe('_create(attributes)', () => {
    require('./adaptors/_Dynamo/_create.spec')
  })

  describe('_index(query, options)', () => {
    require('./adaptors/_Dynamo/_index.spec')
  })

  describe('_read(query, options)', () => {
    require('./adaptors/_Dynamo/_read.spec')
  })

  describe('_update(query, attributes)', () => {
    require('./adaptors/_Dynamo/_update.spec')
  })

  describe('_delete(query, attributes)', () => {
    require('./adaptors/_Dynamo/_delete.spec')
  })

  describe('> Document', () => {
    require('./adaptors/_Dynamo/Document.spec')
  })
})
