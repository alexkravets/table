'use strict'

const { expect, Dynamo, DynamoDocument } = require('./helpers')

describe('.dynamo', () => {
  it('returns DynamoDB client', () => {
    expect(DynamoDocument.dynamo).to.exist
  })
})

describe('.documentId(attributes)', () => {
  it('returns UUID by default', () => {
    const Document = Dynamo(class {
      static get documentIdKey() {
        return 'id'
      }
    })

    let id = Document.documentId()
    expect(id).to.exist

    id = Document.documentId({ id: 'PREDEFINED_ID' })
    expect(id).to.equal('PREDEFINED_ID')
  })
})
