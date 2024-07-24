'use strict'

const { expect } = require('chai')
const Hashids = require('hashids')

const CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
const SECONDARY_KEY = 'secondaryKey'

const Document = class {
  static _index() {}
  static _create() {}
}

const CustomDocument = require('src/withHashId')(Document)

describe('Custom Document Class', () => {
  describe('secondaryKeyIndex', () => {
    it('should return the correct secondary key index', () => {
      expect(CustomDocument.secondaryKeyIndex).to.equal(`${SECONDARY_KEY}Index`)
    })
  })

  describe('_index', () => {
    it('should call super._index with extended query and options', async () => {
      const query = { someKey: 'someValue' }
      const options = { limit: 10 }

      let calledWithArgs
      Document._index = function (...args) {
        calledWithArgs = args
      }

      await CustomDocument._index(query, options)

      expect(calledWithArgs).to.deep.equal([
        {
          ...query,
          [`${SECONDARY_KEY}:bw`]: CustomDocument.documentName,
        },
        {
          ...options,
          index: `${SECONDARY_KEY}Index`,
        }
      ])
    })

    it('should call super._index with extended options with index', async () => {
      const query = { someKey: 'someValue' }
      const options = { limit: 10, index: 'nameIndex' }

      let calledWithArgs
      Document._index = function (...args) {
        calledWithArgs = args
      }

      await CustomDocument._index(query, options)

      expect(calledWithArgs).to.deep.equal([
        {...query},
        { ...options, index: 'nameIndex'}
      ])
    })
  })

  describe('_createHashId', () => {
    it('should create hash id with provided prefix', () => {
      const document = 'testDocument'
      const number = 123
      const idKeyPrefix = 'testPrefix'
      const CustomDocWithPrefix = require('src/withHashId')(Document, idKeyPrefix)

      const hashId = CustomDocWithPrefix._createHashId(document, number)
      const expectedHashId = new Hashids(document, 0, CHARACTER_SET).encode(number)

      expect(hashId).to.equal(`${idKeyPrefix}${expectedHashId}`)
    })

    it('should create hash id without prefix when no idKeyPrefix is provided', () => {
      const document = 'testDocument'
      const number = 123

      const hashId = CustomDocument._createHashId(document, number)
      const expectedHashId = new Hashids(document, 0, CHARACTER_SET).encode(number)

      expect(hashId).to.equal(expectedHashId)
    })

    it('should create hash id with class prefix if no idKeyPrefix is provided and class has a different idKeyPrefix', () => {
      const document = 'testDocument'
      const number = 123
      CustomDocument.idKeyPrefix = 'classPrefix'
      CustomDocument.documentName = 'differentDocumentName'

      const hashId = CustomDocument._createHashId(document, number)
      const expectedHashId = new Hashids(document, 0, CHARACTER_SET).encode(number)

      expect(hashId).to.equal(`classPrefix_${expectedHashId}`)
    })
  })

  describe('_getNextNumber', () => {
    it('should get the next number based on the last item', async () => {
      Document._index = async () => ({
        items: [{}]
      })

      const nextNumber = await CustomDocument._getNextNumber('testPartition')

      expect(nextNumber).to.equal(1)
    })

    it('should return 1 if no last item is found', async () => {
      Document._index = async () => ({
        items: []
      })

      const nextNumber = await CustomDocument._getNextNumber('testPartition')

      expect(nextNumber).to.equal(1)
    })
  })

  describe('_create', () => {
    it('should create a document with generated number and id', async () => {
      const attributes = {
        document: 'testDocument',
        number: 1,
        createdAt: '2024-01-01'
      }

      Document._create = async () => true
      CustomDocument._getNextNumber = async () => 1
      CustomDocument._createHashId = () => 'testId'

      const result = await CustomDocument._create(attributes)

      expect(result).to.be.true
      expect(attributes.number).to.equal(1)
      expect(attributes[CustomDocument.idKey]).to.equal('testId')
      expect(attributes.secondaryKey).to.equal('testDocument_2024-01-01')
    })

    it('should retry creating a document if the first attempt fails', async () => {
      const attributes = {
        partition: 'testPartition',
        createdAt: '2024-01-01'
      }

      let createCallCount = 0
      Document._create = async () => {
        createCallCount += 1
        return createCallCount === 2
      }
      CustomDocument._getNextNumber = async () => 1
      CustomDocument._createHashId = () => 'testId'

      const result = await CustomDocument._create(attributes)

      expect(result).to.be.true
      expect(createCallCount).to.equal(2)
    })
  })
})
