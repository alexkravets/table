'use strict'

describe('Errors', () => {
  require('./errors/ResourceExistsError.spec')
  require('./errors/ResourceNotFoundError.spec')
})

describe('Dynamo', () => {
  describe('_create(attributes)', () => {
    require('./dynamo/_create.spec')
  })

  describe('_index(query, options)', () => {
    require('./dynamo/_index.spec')
  })

  describe('_read(query, options)', () => {
    require('./dynamo/_read.spec')
  })

  describe('_update(query, attributes)', () => {
    require('./dynamo/_update.spec')
  })

  describe('_delete(query, attributes)', () => {
    require('./dynamo/_delete.spec')
  })

  describe('> Document', () => {
    require('./dynamo/Document.spec')
  })
})
