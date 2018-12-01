'use strict'

module.exports = {
  Dynamo:                require('./lib/dynamo'),
  ResourceExistsError:   require('./lib/errors/ResourceExistsError'),
  ResourceNotFoundError: require('./lib/errors/ResourceNotFoundError')
}
