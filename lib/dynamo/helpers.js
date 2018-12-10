const getProjectionExpression = (projectionAttributes) => {
  const ProjectionExpression = []
  const ExpressionAttributeNames = {}

  for (let attribute of projectionAttributes) {
    attribute = attribute.trim()

    const attributeKeys = attribute.split('.')
    const attributeNames = []

    for (let attributeKey of attributeKeys) {
      const arrayIndex = attributeKey.match(/\[\d+\]/g)
      attributeKey = attributeKey.replace(/\[\d+\]/g, '')
      ExpressionAttributeNames[`#${attributeKey}`] = attributeKey

      const attributeName = `#${attributeKey}${arrayIndex ? arrayIndex : ''}`
      attributeNames.push(attributeName)
    }
    ProjectionExpression.push(attributeNames.join('.'))
  }

  return {
    ProjectionExpression: ProjectionExpression.join(','),
    ExpressionAttributeNames
  }
}

module.exports = {
  getProjectionExpression
}