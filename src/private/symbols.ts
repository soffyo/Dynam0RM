// Query operators
export const equal = Symbol.for('=')
export const notEqual = Symbol.for('<>')
export const lesser = Symbol.for('<')
export const lesserEqual = Symbol.for('<=')
export const greater = Symbol.for('>')
export const greaterEqual = Symbol.for('>=')
export const between = Symbol.for('between')
export const beginsWith = Symbol.for('begins_with')

export const query = { equal, notEqual, lesser, lesserEqual, greater, greaterEqual, between, beginsWith }

// Condition operators
export const contains = Symbol.for('contains')
export const into = Symbol.for('in')
export const size = Symbol.for('size')
export const attributeExists = Symbol.for('attribute_exists')
export const attributeType = Symbol.for('attribute_type')

export const condition = {...query, contains, into, size, attributeExists, attributeType }

// Update operators
export const add = Symbol.for('add')
export const Delete = Symbol.for('delete')
export const append = Symbol.for('append')
export const prepend = Symbol.for('prepend')
export const remove = Symbol.for('remove')
export const increment = Symbol.for('increment')
export const decrement = Symbol.for('decrement')

export const update = { add, delete: Delete, append, prepend, remove, increment, decrement }

// Properties
export const keySchema = Symbol.for('keySchema')
export const attributeDefinitions = Symbol.for('attributeDefinitions')
export const localIndexes = Symbol.for('localIndexes')
export const globalIndexes = Symbol.for('globalIndexes')
export const tableName = Symbol.for('tableName')
export const client = Symbol.for('client')
export const dynamodb = Symbol.for('dynamodb')
export const ttl = Symbol.for('ttl')

export const prop = { keySchema, attributeDefinitions, localIndexes, globalIndexes, tableName, client, dynamodb }

export type UpdateSymbols = typeof add | typeof Delete | typeof append | typeof remove
export type QuerySymbols = typeof equal | typeof notEqual | typeof lesser | typeof lesserEqual | typeof greater | typeof greaterEqual | typeof between | typeof beginsWith
export type ConditionSymbols = QuerySymbols | typeof contains | typeof into | typeof size | typeof attributeExists | typeof attributeType
