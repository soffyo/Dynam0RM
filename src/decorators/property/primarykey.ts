import 'reflect-metadata'
import { KeySchemaElement, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { attributeDefinition, addToPrivateMapArray } from './functions'
import { validatePrimaryKey } from 'src/validation'
import { mainPM } from 'src/private'
import * as symbol from 'src/definitions/symbols'

function addAttribute(prototype: any, key: string, keySchemaElement: KeySchemaElement, name: string|symbol, index?: number) {
    const type = validatePrimaryKey(Reflect.getMetadata('design:type', prototype, key))
    addToPrivateMapArray(mainPM, prototype.constructor, symbol.keySchema, keySchemaElement, index)
    addToPrivateMapArray(mainPM, prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
}

export function partitionKey(prototype: any, key: string) {
    const localIndexes = mainPM(prototype.constructor).get<LocalSecondaryIndex[]>(symbol.localIndexes)
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: 'HASH'
    }
    Object.defineProperty(prototype.constructor, 'partitionKey', {
        value: key,
        enumerable: true
    })
    if (localIndexes) for (const index of localIndexes) {
        if (index.KeySchema) index.KeySchema[0].AttributeName = key
    }
    addAttribute(prototype, key, keySchemaElement, symbol.partitionKey, 0)
}

export function sortKey(prototype: any, key: string) {
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: 'RANGE'
    }
    Object.defineProperty(prototype.constructor, 'sortKey', {
        value: key,
        enumerable: true
    })
    addAttribute(prototype, key, keySchemaElement, symbol.sortKey, 1)
}