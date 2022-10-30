import {KeySchemaElement, AttributeDefinition, GlobalSecondaryIndex, LocalSecondaryIndex} from '@aws-sdk/client-dynamodb'
import {Class, JSObject, PrimaryKey} from 'src/types'
import {TablesWM} from 'src/private'
import {Dynam0RMTable} from 'src/table'
import * as symbols from 'src/private/symbols'
import {Dynam0RMError} from "src/validation/error";

export function validateKey<T extends Dynam0RMTable>(constructor: Class<T>, key: any, indexName?: string): key is PrimaryKey<T> {
    let keySchema = TablesWM(constructor).get<KeySchemaElement[]>(symbols.keySchema)

    if (indexName) {
        const joinedIndexes = []
        const localIndexes = TablesWM(constructor).get<GlobalSecondaryIndex[]>(symbols.localIndexes)
        const globalIndexes = TablesWM(constructor).get<LocalSecondaryIndex[]>(symbols.globalIndexes)
        if (localIndexes) joinedIndexes.push(...localIndexes)
        if (globalIndexes) joinedIndexes.push(...globalIndexes)
        for (const index of joinedIndexes) {
            if (index.IndexName === indexName) {
                keySchema = index.KeySchema
                break
            }
        }
    }

    const attributeDefinitions = TablesWM(constructor).get<AttributeDefinition[]>(symbols.attributeDefinitions)
    const hashKey = keySchema?.length ? keySchema[0]?.AttributeName : undefined
    const rangeKey = keySchema?.length ? keySchema[1]?.AttributeName : undefined
    const hashType = attributeDefinitions?.filter(a => a.AttributeName === hashKey)[0]?.AttributeType === 'S' ? 'string' : 'number'
    const rangeType = attributeDefinitions?.filter(a => a.AttributeName === rangeKey)[0]?.AttributeType === 'S' ? 'string' : 'number'

    function check(kind: string | undefined, type: string) {
        if (kind) {
            const value = key[kind]
            if (!(kind in key)) {
                return false
            }
            if (typeof value !== type) {
                return false
            }
            if (typeof value === 'number' && isNaN(value)) {
                return false
            }
        }
        return true
    }
    if (!check(hashKey, hashType) || !check(rangeKey, rangeType)) {
        Dynam0RMError.invalidKey(constructor, key)
        return false
    }
    return key !== undefined
}