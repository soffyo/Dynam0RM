import {AttributeDefinition} from '@aws-sdk/client-dynamodb'
import 'reflect-metadata'

import {createWeakMap} from 'src/private/weakmaps'
import {checkEquality} from 'src/utils'

export function addToPrivateMapArray(pm: ReturnType<typeof createWeakMap>, constructor: object, key: string | symbol, value: any, index?: number) {
    if (!pm(constructor).has(key)) {
        pm(constructor).set(key, [])
    }
    if (Array.isArray(pm(constructor).get(key))) {
        if (typeof index === 'number') {
            pm(constructor).get(key)[index] = value
        } else {
            let isEqual = false
            for (const item of pm(constructor).get(key)) {
                if (checkEquality(item, value)) isEqual = true
            }
            if (!isEqual) pm(constructor).get(key).push(value)
        }
    }
}

export function attributeDefinition(key: string, type: Function): AttributeDefinition {
    return {
        AttributeName: key,
        AttributeType: type === String ? 'S' : type === Number ? 'N' : undefined
    }
}

export function getType(prototype: Object, key: string): Function {
    return Reflect.getMetadata('design:type', prototype, key)
}