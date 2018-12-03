'use strict'

const fs    = require('fs')
const uuid  = require('uuid/v1')
const find  = require('lodash.find')
const keyBy = require('lodash.keyby')
const rootPath = process.cwd()
const { safeLoad: load } = require('js-yaml')

const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const File = Component => class extends Component {
  static async index(context, query = {}, options = {}) {
    const objects = this.source.map(attributes => new this(context, attributes))
    const count   = objects.length

    return { objects, count }
  }

  static async read(context, query) {
    const attributes = find(this.sourceMap, query)

    if (!attributes) {
      throw new ResourceNotFoundError(this.name, query)
    }

    return new this(context, attributes)
  }

  static get fileName() {
    const { name } = this
    return `${name}.yaml`
  }

  static get path() {
    return `${rootPath}/data/${this.fileName}`
  }

  static get source() {
    if (this._source) { return this._source }

    const { path } = this
    this._source = load(fs.readFileSync(path, 'utf8'))

    for (const attributes of this._source) {
      attributes.id = attributes.id || uuid()
    }

    return this._source
  }

  static get sourceMap() {
    if (this._sourceMap) { return this._sourceMap }

    this._sourceMap = keyBy(this.source, 'id')

    return this._sourceMap
  }
}

module.exports = File
