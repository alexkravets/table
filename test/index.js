'use strict'

describe('Errors', () => {
  require('./errors/ResourceExistsError.spec')
  require('./errors/ResourceNotFoundError.spec')
})

describe('Dynamo', () => {
  require('./dynamo/index.spec')
})
