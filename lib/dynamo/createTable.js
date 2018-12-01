'use strict'

const getTableSchema = (TableName) => {
  const AttributeDefinitions = [{
    AttributeName: 'resourceName',
    AttributeType: 'S'
  }, {
    AttributeName: 'id',
    AttributeType: 'S'
  }, {
    AttributeName: 'createdAt',
    AttributeType: 'S'
  }]

  const KeySchema = [{
    AttributeName: 'id',
    KeyType:       'HASH'
  }]

  const GlobalSecondaryIndexes = [{
    IndexName: 'defaultIndex',
    KeySchema: [{
      AttributeName: 'resourceName',
      KeyType: 'HASH',
    }, {
      AttributeName: 'createdAt',
      KeyType: 'RANGE',
    }],
    ProvisionedThroughput: {
      ReadCapacityUnits:  1,
      WriteCapacityUnits: 1
    },
    Projection: {
      ProjectionType: 'ALL'
    }
  }]

  return {
    TableName,
    KeySchema,
    AttributeDefinitions,
    GlobalSecondaryIndexes,
    ProvisionedThroughput: {
      ReadCapacityUnits:  1,
      WriteCapacityUnits: 1
    }
  }
}

const createTable = async(rawClient, TableName, indexes) => {
  const tableSchema = getTableSchema(TableName, indexes)
  try {
    await rawClient.createTable(tableSchema).promise()

  } catch (error) {
    if (error.code != 'ResourceInUseException') {
      throw error
    }
  }
}

module.exports = createTable
