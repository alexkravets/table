'use strict'

describe('Management', () => {
  require('./management')
})

describe('Operations', () => {
  require('./operations/create.spec')
  require('./operations/read.spec')
  require('./operations/delete.spec')
  require('./operations/update.spec')
})
