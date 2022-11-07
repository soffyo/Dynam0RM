import {KeySchemaElement, AttributeDefinition} from '@aws-sdk/client-dynamodb'

import {validateType} from 'src/validation'
import {TablesWM} from 'src/private'
import {isObject} from 'src/utils'
import {Class, JSObject, PrimaryKey, PrimaryKeyObject} from 'src/types'
import {Dynam0RMTable} from 'src/table'
import {Dynam0RMError} from 'src/validation'
import * as symbols from 'src/private/symbols'

function convertKey(constructor: Class, key: string, value: string | number) {
    const attributeDefinitions = TablesWM(constructor).get<AttributeDefinition[]>(symbols.attributeDefinitions)
    let type: string = ''
    if (attributeDefinitions) for (const attr of attributeDefinitions) {
        if (attr.AttributeName === key) {
            if (attr.AttributeType) type = attr.AttributeType
            break
        }
    }
    if (type) {
        if (typeof value === 'string' && type === 'N') value = +value
        if (typeof value === 'number' && type === 'S') value = value.toString()
    }
    return value
}

export function generateKeys<T extends Dynam0RMTable>(constructor: Class<T>, keys: [PrimaryKeyObject] | (T | string | number)[]) {
    const keySchema = TablesWM(constructor).get<KeySchemaElement[]>(symbols.keySchema)
    const generatedKeys: PrimaryKey<any>[] = []
    for (const key of keys) if (keySchema?.length) {
        const hashKey = keySchema[0]?.AttributeName
        const rangeKey = keySchema[1]?.AttributeName
        if (key instanceof Dynam0RMTable) {
            generatedKeys.push(extractKey(constructor, key))
        } else if (isObject(key)) {
            for (const [hashValue, rangeValue] of Object.entries(key)) {
                if (hashKey && rangeKey) {
                    if (Array.isArray(rangeValue)) {
                        for (const iRangeValue of rangeValue) {
                            generatedKeys.push({
                                [hashKey]: convertKey(constructor, hashKey, hashValue),
                                [rangeKey]: convertKey(constructor, rangeKey, iRangeValue)
                            })
                        }
                    } else {
                        generatedKeys.push({
                            [hashKey]: convertKey(constructor, hashKey, hashValue),
                            [rangeKey]: convertKey(constructor, rangeKey, rangeValue),
                        })
                    }
                } else {
                    const wrongKey = {
                        [hashKey ?? 'undefined']: convertKey(constructor, hashKey ?? 'undefined', hashValue),
                        [rangeKey ?? 'undefined']: convertKey(constructor, hashKey ?? 'undefined', rangeValue),
                    }
                    Dynam0RMError.invalidKey(constructor, wrongKey)
                }
            }
            //break
        } else {
            if (hashKey) generatedKeys.push({
                [hashKey]: convertKey(constructor, hashKey, key)
            })
        }
    }
    return generatedKeys as PrimaryKey<T>[]
}

export function extractKey<T>(constructor: Class<T>, element: T): PrimaryKey<T> {
    let key = {}
    const keySchema = TablesWM(constructor).get<KeySchemaElement[]>(symbols.keySchema)
    for (const k in element) {
        if (keySchema && (k === keySchema[0]?.AttributeName  || k === keySchema[1]?.AttributeName)) {
            key = {
                ...key,
                [k]: element[k]
            }
        }
    }
    return key as PrimaryKey<T>
}

export function excludeKey(constructor: Class, element: JSObject) {
    const object = { ...element }
    for (const k in object) {
        const keySchema = TablesWM(constructor).get<KeySchemaElement[]>(symbols.keySchema)
        if (keySchema && (k === keySchema[0]?.AttributeName || k === keySchema[1]?.AttributeName)) {
            delete object[k]
        }
    }
    return object
}

export function proxy <T extends Dynam0RMTable> (obj: any): T {
    return new Proxy <T> (obj, {
        get(target: any, key) {
            if (!(key in target) && typeof key !== 'symbol') {
                return target[key] = proxy({})
            }
            return Reflect.get(target, key)
        },
        set(target, key, receiver) {
            if (validateType(receiver)) {
                return Reflect.set(target, key, receiver)
            } else {
                Dynam0RMError.invalidType(obj, key)
                return true
            }
        }
    })
}