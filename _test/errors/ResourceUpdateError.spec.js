'use strict'

const { expect }          = require('chai')
const ResourceUpdateError = require('src/errors/ResourceUpdateError')

describe('ResourceUpdateError', () => {
  it('creates item', async() => {
    const query         = { id: 'ID' }
    const attributes    = { firstName: 'Alexander' }
    const originalError = new Error('Unexpected DynamoDB error')

    const error = new ResourceUpdateError(originalError, query, attributes)
    expect(error.code).to.eql('ResourceUpdateError')
    expect(error.message).to.include('Unexpected DynamoDB error')
  })
})
