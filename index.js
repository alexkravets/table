'use strict'

module.exports = {
  File:                  require('./lib/file'),
  Dynamo:                require('./lib/dynamo'),
  ResourceExistsError:   require('./lib/errors/ResourceExistsError'),
  ResourceNotFoundError: require('./lib/errors/ResourceNotFoundError')
}
