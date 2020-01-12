'use strict'

module.exports = {
  File:                  require('./src/File'),
  Dynamo:                require('./src/Dynamo'),
  ResourceUpdateError:   require('./src/errors/ResourceUpdateError'),
  ResourceExistsError:   require('./src/errors/ResourceExistsError'),
  ResourceNotFoundError: require('./src/errors/ResourceNotFoundError')
}
