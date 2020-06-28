'use strict'

module.exports = {
  indexes: {
    defaultLocalIndex: {
      sortKey: 'createdAt'
    },
    recentLocalIndex: {
      sortKey: 'updatedAt'
    },
    userGlobalIndex: {
      partitionKey: 'userId',
      sortKey: 'createdAt'
    },
    companyGlobalIndex: {
      partitionKey: 'companyId'
    }
  }
}
