'use strict'

module.exports = {
  File:                  require('./lib/file'),
  Dynamo:                require('./lib/dynamo'),
  ResourceUpdateError:   require('./lib/errors/ResourceUpdateError'),
  ResourceExistsError:   require('./lib/errors/ResourceExistsError'),
  ResourceNotFoundError: require('./lib/errors/ResourceNotFoundError')
}
