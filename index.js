'use strict'

module.exports = {
  File:                  require('./src/adaptors/File'),
  Dynamo:                require('./src/adaptors/Dynamo'),
  ResourceUpdateError:   require('./src/errors/ResourceUpdateError'),
  ResourceExistsError:   require('./src/errors/ResourceExistsError'),
  ResourceNotFoundError: require('./src/errors/ResourceNotFoundError')
}
