import { KeySchemaElement, AttributeDefinition } from '@aws-sdk/client-dynamodb'
import { Class, PrimaryKeys } from 'src/types'
import { mainPM } from 'src/private'
import * as symbols from 'src/private/symbols'

export function validatePrimaryKey<T>(target: Class, keys: PrimaryKeys<T>) {
    const ks = mainPM(target).get<KeySchemaElement[]>(symbols.keySchema)
    const pk = ks && ks[0].AttributeName
    const sk = ks && ks[1]?.AttributeName
    const table = mainPM(target).get<string>(symbols.tableName)
    const wrong = []
    let index = 0
    for (const key in keys) {
        if ((keys[key] as any)?.constructor.name !== 'String' && (keys[key] as any)?.constructor.name !== 'Number') {
            throw new Error('Invalid type')
        }
        if ((pk && !sk) && index > 0) {
            throw new Error(`Primary key for table [${table}] must include only one key (${pk}) but keys [${Object.keys(keys).join(', ')}] have been found.`)
        } else if ((pk && sk) && index > 1) {
            throw new Error(`Primary key for table [${table}] must include two keys (${pk}, ${sk}) but [${Object.keys(keys).join(', ')}] have been found.`)
        }
        if (key !== pk && key !== sk) {
            wrong.push(key)
        }
        if (key === pk || key === sk) {
            const attributeDefinitions = mainPM(target).get<AttributeDefinition[]>(symbols.attributeDefinitions)
            if (attributeDefinitions) for (const item of attributeDefinitions) {
                if (item.AttributeName === key) {
                    const type = (keys[key] as any).constructor.name
                    if ((item.AttributeType === 'S' && type !== 'String') ||
                    ((item.AttributeType === 'N' || item.AttributeType === 'B') && type !== 'Number')) {
                        const rightType = (item.AttributeType === 'N' || item.AttributeType === 'B') ? 'Number' : 'String'
                        throw new Error(`Invalid type (${type}) assigned. Key [${key}] on table [${table}] must have type ${rightType}.`)
                    }
                }
            }
        }
        index++
    }
    if (wrong.length) {
        throw TypeError(`Invalid keys (${wrong.join(', ')}) used as primary key on table [${table}]. Table's key schema was setup with partition key [${pk}]${sk ? ' and sort key [' + sk+']' : ''}.`)
    }
    return keys
}