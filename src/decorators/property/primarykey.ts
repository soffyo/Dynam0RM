import { KeySchemaElement, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'

import {attributeDefinition, addToPrivateMapArray, getType} from './functions'
import {Dynam0RMError} from 'src/validation'
import {TablesWM} from 'src/private'
import * as symbols from 'src/private/symbols'

function addAttribute(caller: Function, prototype: any, key: string, keySchemaElement: KeySchemaElement, index?: number) {
    const type = getType(prototype, key)
    if (type === String || type === Number) {
        addToPrivateMapArray(TablesWM, prototype.constructor, symbols.keySchema, keySchemaElement, index)
        addToPrivateMapArray(TablesWM, prototype.constructor, symbols.attributeDefinitions, attributeDefinition(key, type))
    } else {
        const message = `Decorator @${caller.name} may only be used on properties of type String or Number. Property [${key}] has type '${type?.name}'.`
        Dynam0RMError.invalidDecorator(prototype.constructor, caller.name, message)
    }
}

export function HashKey(prototype: any, key: string) {
    const localIndexes = TablesWM(prototype.constructor).get<LocalSecondaryIndex[]>(symbols.localIndexes)
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: 'HASH'
    }
    if (localIndexes) for (const index of localIndexes) {
        if (index.KeySchema?.length) index.KeySchema[0].AttributeName = key
    }
    addAttribute(HashKey, prototype, key, keySchemaElement, 0)
}

export function RangeKey(prototype: any, key: string) {
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: 'RANGE'
    }
    addAttribute(RangeKey, prototype, key, keySchemaElement, 1)
}