import { KeySchemaElement, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { attributeDefinition, addToPrivateMapArray } from './functions'
import { validateKeyDecorator } from 'src/validation'
import { mainPM } from 'src/private'
import * as symbols from 'src/private/symbols'

function addAttribute(prototype: any, key: string, keySchemaElement: KeySchemaElement, index?: number) {
    const type = validateKeyDecorator(prototype.constructor, key)
    addToPrivateMapArray(mainPM, prototype.constructor, symbols.keySchema, keySchemaElement, index)
    addToPrivateMapArray(mainPM, prototype.constructor, symbols.attributeDefinitions, attributeDefinition(key, type))
}

export function partitionKey(prototype: any, key: string) {
    const localIndexes = mainPM(prototype.constructor).get<LocalSecondaryIndex[]>(symbols.localIndexes)
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: 'HASH'
    }
    if (localIndexes) for (const index of localIndexes) {
        if (index.KeySchema) index.KeySchema[0].AttributeName = key
    }
    addAttribute(prototype, key, keySchemaElement, 0)
}

export function sortKey(prototype: any, key: string) {
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: 'RANGE'
    }
    addAttribute(prototype, key, keySchemaElement, 1)
}