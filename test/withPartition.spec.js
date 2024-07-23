'use strict'

const { expect } = require('chai')

const INDEX_QUERY_ID_PREFIX_KEY = 'id:bw'

const Document = class {
  static index() {}
  static create() {}
  static read() {}
  static update() {}
  static delete() {}
}

const CustomDocument = require('src/withPartition')(Document)

describe('withPartition = (Document, path)', () => {
  describe('_query', () => {
    it('should return the correct query object', () => {
      const instance = new CustomDocument()
      instance.constructor.idKey = 'testIdKey'
      instance.attributes = {
        testIdKey: 'testValue',
        partition: 'testPartition'
      }

      const expectedQuery = {
        testIdKey: 'testValue',
        partition: 'testPartition'
      }

      expect(instance._query).to.deep.equal(expectedQuery)
    })
  })

  describe('_getPartition', () => {
    it('should return the partition from parameters if provided', () => {
      const parameters = { partition: 'testPartition' }
      const result = CustomDocument._getPartition({}, parameters)

      expect(result).to.equal('testPartition')
    })

    it('should return the partition from context if not provided in parameters', () => {
      const context = { identity: { organizationId: 'testPartition' } }
      const parameters = {}
      const result = CustomDocument._getPartition(context, parameters)

      expect(result).to.equal('testPartition')
    })

    it('should throw an error if partition is not defined in context or parameters', () => {
      const context = {}
      const parameters = {}

      expect(() => CustomDocument._getPartition(context, parameters)).to.throw(
        'Context is missing "identity.organizationId", partition is not defined'
      )
    })
  })

  describe('_extendIndexQueryWithIdPrefix', () => {
    it('should extend the query with the id prefix', () => {
      const context = {}
      const query = {}
      const options = {}

      CustomDocument.idKeyPrefix = 'prefix'
      CustomDocument.documentName = 'document'
      CustomDocument._getPartition = () => 'partition'

      CustomDocument._extendIndexQueryWithIdPrefix(context, query, options)

      expect(query).to.deep.equal({
        document: 'document',
        partition: 'partition',
        [INDEX_QUERY_ID_PREFIX_KEY]: 'prefix'
      })
    })

    it('should not override the id prefix if index is provided', () => {
      const context = {}
      const query = {}
      const options = { index: 'someIndex' }

      CustomDocument.documentName = 'document'
      CustomDocument._extendIndexQueryWithIdPrefix(context, query, options)

      expect(query).to.deep.equal({
        document: 'document'
      })
    })

    it('should not override the id prefix if the default prefix is used', () => {
      const context = {}
      const query = {}
      const options = {}

      CustomDocument.idKeyPrefix = CustomDocument.documentName
      CustomDocument.documentName = 'document'
      CustomDocument._getPartition = () => 'partition'

      CustomDocument._extendIndexQueryWithIdPrefix(context, query, options)

      expect(query).to.deep.equal({
        document: 'document',
        partition: 'partition'
      })
    })

    it('should not override the id prefix if it is already defined in the query', () => {
      const context = {}
      const query = { [INDEX_QUERY_ID_PREFIX_KEY]: 'existingPrefix' }
      const options = {}

      CustomDocument.documentName = 'document'
      CustomDocument._getPartition = () => 'partition'

      CustomDocument._extendIndexQueryWithIdPrefix(context, query, options)

      expect(query).to.deep.equal({
        document: 'document',
        partition: 'partition',
        [INDEX_QUERY_ID_PREFIX_KEY]: 'existingPrefix'
      })
    })

    it('should not override the id prefix if it is already defined in the query and index is not provided', () => {
      const context = {}
      const query = { [INDEX_QUERY_ID_PREFIX_KEY]: 'existingPrefix' }
      const options = {}

      CustomDocument.documentName = 'document'
      CustomDocument.idKeyPrefix = 'prefix'
      CustomDocument._getPartition = () => 'partition'

      CustomDocument._extendIndexQueryWithIdPrefix(context, query, options)

      expect(query).to.deep.equal({
        document: 'document',
        partition: 'partition',
        [INDEX_QUERY_ID_PREFIX_KEY]: 'existingPrefix'
      })
    })
  })

  describe('index', () => {
    it('should call super.index with extended query and options', async () => {
      const context = {}
      const query = {}

      let calledWithArgs
      Document.index = async (...args) => {
        calledWithArgs = args
      }

      await CustomDocument.index(context, query)

      expect(calledWithArgs).to.deep.equal([context, query, {}])
    })
  })

  describe('create', () => {
    it('should call super.create with extended parameters', async () => {
      const context = {}
      const query = {}

      let calledWithArgs
      Document.create = async (...args) => {
        calledWithArgs = args
      }

      await CustomDocument.create(context, query)

      expect(calledWithArgs).to.deep.equal([context, {
        document: 'document',
        partition: 'partition'
      }])
    })
  })

  describe('read', () => {
    it('should call super.read with extended query and options with index', async () => {
      const context = {}
      const query = {}
      const options = { index: 'nameIndex' }

      let calledWithArgs
      Document.read = async (...args) => {
        calledWithArgs = args
      }

      await CustomDocument.read(context, query, options)

      expect(calledWithArgs).to.deep.equal([context, query, options])
    })

    it('should call super.read with extended query', async () => {
      const context = {}
      const query = {}

      let calledWithArgs
      Document.read = async (...args) => {
        calledWithArgs = args
      }

      await CustomDocument.read(context, query)

      expect(calledWithArgs).to.deep.equal([context, query, {}])
    })
  })

  describe('update', () => {
    it('should call super.update with extended query and mutation', async () => {
      const context = {}
      const query = {}
      const mutation = {}
      const originalDocument = {}

      let calledWithArgs
      Document.update = async (...args) => {
        calledWithArgs = args
      }

      await CustomDocument.update(context, query, mutation, originalDocument)

      expect(calledWithArgs).to.deep.equal([context, query, mutation, originalDocument])
    })
  })

  describe('delete', () => {
    it('should call super.delete with extended query', async () => {
      const context = {}
      const query = {}

      let calledWithArgs
      Document.delete = async (...args) => {
        calledWithArgs = args
      }

      await CustomDocument.delete(context, query)

      expect(calledWithArgs).to.deep.equal([context, query])
    })
  })
})
