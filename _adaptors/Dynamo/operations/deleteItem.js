'use strict'

const omit                    = require('lodash.omit')
const buildItemKey            = require('../helpers/buildItemKey')
const ResourceNotFoundError   = require('../../../errors/ResourceNotFoundError')
const getConditionExpression  = require('../helpers/getConditionExpression')
const CollectionNotFoundError = require('../../../errors/CollectionNotFoundError')

const deleteItem = async(client, queryKey, query) => {
  const { tableName: TableName, partitionKey, resourceName } = queryKey

  const Key = buildItemKey('Delete', queryKey, query)

  let {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression
  } = getConditionExpression(omit(query, [ partitionKey ]))

  const deleteParameters = {
    Key,
    TableName,
    ConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  try {
    await client.delete(deleteParameters).promise()

  } catch (dynamoError) {
    if (dynamoError.code === 'ConditionalCheckFailedException') {
      throw new ResourceNotFoundError(resourceName, { queryKey, query })
    }

    /* istanbul ignore else: No need to simulate unexpected Dynamo errors */
    if (dynamoError.code === 'ResourceNotFoundException') {
      throw new CollectionNotFoundError(resourceName, TableName)
    }

    /* istanbul ignore next: No need to simulate unexpected Dynamo errors */
    throw dynamoError
  }
}

module.exports = deleteItem
