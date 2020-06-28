'use strict'

const querystring               = require('querystring')
const buildConditionExpression  = require('./buildConditionExpression')
const buildProjectionExpression = require('./buildProjectionExpression')

const buildQueryParameters = (TableName, indexKey, query, options) => {
  const { sortKey, partitionKey } = indexKey

  const {
    [sortKey]:      sortKeyValue,
    [partitionKey]: partitionKeyValue,
    ...conditionQuery
  } = query

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression: FilterExpression } = buildConditionExpression(conditionQuery)

  const parameters = {
    TableName,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }

  const {
    sort,
    limit,
    indexName,
    projection,
    consistentRead = false,
    exclusiveStartKey
  } = options

  if (indexName) {
    parameters.IndexName = indexName
  }

  if (FilterExpression) {
    parameters.FilterExpression = FilterExpression
  }

  parameters.ScanIndexForward = (!sort || sort === 'asc')

  if (limit) {
    parameters.Limit = limit
  }

  if (exclusiveStartKey) {
    parameters.ExclusiveStartKey = querystring.parse(exclusiveStartKey)
  }

  parameters.ConsistentRead = consistentRead

  parameters.KeyConditionExpression = `#${partitionKey} = :${partitionKey}`
  parameters.ExpressionAttributeNames[`#${partitionKey}`]  = partitionKey
  parameters.ExpressionAttributeValues[`:${partitionKey}`] = partitionKeyValue

  if (sortKeyValue) {
    // NOTE: Sort key may support other comparison options:
    //       https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html

    // Valid comparisons for the sort key condition are as follows:

    // sortKeyName < :sortkeyval - true if the sort key value is less than
    //   :sortkeyval.

    // sortKeyName <= :sortkeyval - true if the sort key value is less than or
    //   equal to :sortkeyval.

    // sortKeyName > :sortkeyval - true if the sort key value is greater than
    //   :sortkeyval.

    // sortKeyName >= :sortkeyval - true if the sort key value is greater than
    //   or equal to :sortkeyval.

    // sortKeyName BETWEEN :sortkeyval1 AND :sortkeyval2 - true if the sort key
    //   value is greater than or equal to :sortkeyval1, and less than or equal
    //   to :sortkeyval2.

    // begins_with ( sortKeyName, :sortkeyval ) - true if the sort key value/
    //   begins with a particular operand. (You cannot use this function with a
    //   sort key that is of type Number.) Note that the function name
    //   begins_with is case-sensitive.

    // Use the ExpressionAttributeValues parameter to replace tokens such as
    // :partitionval and :sortval with actual values at runtime.

    // sortKeyName = :sortkeyval - true if the sort key value is equal to
    //   :sortkeyval.
    parameters.KeyConditionExpression += ` AND #${sortKey} = :${sortKey}`

    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}`] = sortKeyValue
  }

  if (projection) {
    const {
      ProjectionExpression,
      ExpressionAttributeNames
    } = buildProjectionExpression(projection)

    parameters.ProjectionExpression = ProjectionExpression
    parameters.ExpressionAttributeNames = {
      ...parameters.ExpressionAttributeNames,
      ...ExpressionAttributeNames
    }
  }

  return parameters
}

module.exports = buildQueryParameters
