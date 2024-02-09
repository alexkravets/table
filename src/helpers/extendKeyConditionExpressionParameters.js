'use strict'

const extendKeyConditionExpressionParameters = (parameters, sortKey, {
  sortKeyValue,
  sortKeyBeginsWithValue,
  sortKeyLowerThanValue,
  sortKeyGreaterThanValue,
}) => {
  // NOTE: Sort key may support other comparison options:
  //       https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html

  // Valid comparisons for the sort key condition are as follows:

  // sortKeyName < :sortkeyval - true if the sort key value is less than
  //   :sortkeyval.

  // sortKeyName > :sortkeyval - true if the sort key value is greater than
  //   :sortkeyval.

  if (sortKeyValue) {
    // sortKeyName = :sortkeyval - true if the sort key value is equal to
    //   :sortkeyval.
    parameters.KeyConditionExpression += ` AND #${sortKey} = :${sortKey}`

    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}`] = sortKeyValue

    return
  }

  if (sortKeyBeginsWithValue) {
    // begins_with ( sortKeyName, :sortkeyval ) - true if the sort key value/
    //   begins with a particular operand. (You cannot use this function with a
    //   sort key that is of type Number.) Note that the function name
    //   begins_with is case-sensitive.
    // Use the ExpressionAttributeValues parameter to replace tokens such as
    // :partitionval and :sortval with actual values at runtime.
    parameters.KeyConditionExpression += ` AND begins_with(#${sortKey}, :${sortKey})`

    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}`] = sortKeyBeginsWithValue

    return
  }

  if (sortKeyLowerThanValue && sortKeyGreaterThanValue) {
    // sortKeyName BETWEEN :sortkeyval1 AND :sortkeyval2 - true if the sort key
    //   value is greater than or equal to :sortkeyval1, and less than or equal
    //   to :sortkeyval2.

    parameters.KeyConditionExpression += ` AND #${sortKey} BETWEEN :${sortKey}_gt AND :${sortKey}_lt`

    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}_lt`] = sortKeyLowerThanValue
    parameters.ExpressionAttributeValues[`:${sortKey}_gt`] = sortKeyGreaterThanValue

    return
  }

  if (sortKeyLowerThanValue) {
    // sortKeyName <= :sortkeyval - true if the sort key value is less than or
    //   equal to :sortkeyval.
    parameters.KeyConditionExpression += ` AND #${sortKey} <= :${sortKey}_lt`

    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}_lt`] = sortKeyLowerThanValue

    return
  }

  if (sortKeyGreaterThanValue) {
    // sortKeyName >= :sortkeyval - true if the sort key value is greater than
    //   or equal to :sortkeyval.
    parameters.KeyConditionExpression += ` AND #${sortKey} >= :${sortKey}_gt`

    parameters.ExpressionAttributeNames[`#${sortKey}`]  = sortKey
    parameters.ExpressionAttributeValues[`:${sortKey}_gt`] = sortKeyGreaterThanValue

    return
  }
}

module.exports = extendKeyConditionExpressionParameters
