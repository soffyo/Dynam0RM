import {GlobalSecondaryIndex as ISecondaryIndex} from '@aws-sdk/client-dynamodb'

import {attributeDefinition, addToPrivateMapArray, getType} from './functions'
import { OmitMethods } from 'src/types'
import { TablesWM, IndexesWM } from 'src/private'
import {Dynam0RMTable} from 'src/table'
import {Dynam0RMError} from 'src/validation'
import * as symbols from 'src/private/symbols'

type PropertyDecorator = (prototype: any, key: string) => void

export interface IndexProps<T> {
    name?: string,
    attributes?: (keyof OmitMethods<T>)[] | 'keys-only'
}

export interface GlobalIndexProps<T> extends IndexProps<T> {
    throughput?: {
        read: number
        write: number
    }
}

const secondaryIndexSYM = Symbol()
const finalizeSYM = Symbol()

abstract class SecondaryIndex<T extends Dynam0RMTable> {
    public name: string
    protected constructor(kind: 'local'|'global', props?: GlobalIndexProps<T>) {
        const secondaryIndex = IndexesWM(this).set<ISecondaryIndex>(secondaryIndexSYM, {
            KeySchema: [],
            IndexName: undefined,
            Projection: undefined,
            ProvisionedThroughput: undefined
        })
        if (props?.name) {
            this.name = props.name.replace(/[^a-zA-Z0-9\-._]/g, '')
        } else {
            this.name = `Dynam0RM.${kind}Index`
        }
        if (kind === 'global' && props?.throughput) {
            secondaryIndex.ProvisionedThroughput = {
                ReadCapacityUnits: props.throughput.read,
                WriteCapacityUnits: props.throughput.write
            }
        }
        secondaryIndex.Projection = {
            ProjectionType: 'ALL',
            NonKeyAttributes: []
        }
        if (props?.attributes) {
            if (Array.isArray(props.attributes) && props.attributes.length > 0) {
                secondaryIndex.Projection.ProjectionType = 'INCLUDE'
                secondaryIndex.Projection.NonKeyAttributes = props.attributes as string[]
            } else if (props.attributes === 'keys-only') {
                secondaryIndex.Projection.ProjectionType = 'KEYS_ONLY'
            }
        }
        IndexesWM(this).set<boolean>('isValid', false)
        IndexesWM(this).set<PropertyDecorator>(finalizeSYM, (prototype, key) => {
            const type = getType(prototype, key)
            if (type === String || type === Number) IndexesWM(this).set<boolean>('isValid', true)
            const isValid = IndexesWM(this).get<boolean>('isValid')
            if (!props?.name) this.name += `.${key}`
            secondaryIndex.IndexName = this.name
            if (isValid) addToPrivateMapArray(TablesWM, prototype.constructor, symbols.attributeDefinitions, attributeDefinition(key, type))
            else Dynam0RMError.invalidDecorator(prototype.constructor, this.constructor.name)
        })
    }
}

export class LocalSecondaryIndex <T extends Dynam0RMTable> extends SecondaryIndex<T> {
    readonly #rangeKey: PropertyDecorator

    public get RangeKey() {
        return this.#rangeKey
    }

    public constructor(props?: IndexProps<T>) {
        super('local', props)
        const secondaryIndex = IndexesWM(this).get<ISecondaryIndex>(secondaryIndexSYM)
        const finalize = IndexesWM(this).get<PropertyDecorator>(finalizeSYM)!
        this.#rangeKey = (prototype, key) => {
            const keySchema = TablesWM(prototype.constructor).get(symbols.keySchema)
            IndexesWM(this).get<ISecondaryIndex>(secondaryIndexSYM)?.KeySchema?.push(
                {
                    AttributeName: (keySchema && keySchema[0]?.AttributeName) ?? undefined,
                    KeyType: 'HASH'
                },
                {
                    AttributeName: key,
                    KeyType: 'RANGE'
                }
            )
            finalize(prototype, key)
            if (IndexesWM(this).get<boolean>('isValid')) addToPrivateMapArray(TablesWM, prototype.constructor, symbols.localIndexes, secondaryIndex)
        }
    }
}

export class GlobalSecondaryIndex <T extends Dynam0RMTable> extends SecondaryIndex<T> {
    readonly #hashKey: PropertyDecorator
    readonly #rangeKey: PropertyDecorator

    public get HashKey() {
        return this.#hashKey
    }
    public get RangeKey() {
        return this.#rangeKey
    }

    constructor(props?: GlobalIndexProps<T>) {
        super('global', props)
        const secondaryIndex = IndexesWM(this).get<ISecondaryIndex>(secondaryIndexSYM)!
        const finalize = IndexesWM(this).get<PropertyDecorator>(finalizeSYM)!
        const addIndex = (index: 0|1): PropertyDecorator => (prototype, key) => {
            let globalIndexes = TablesWM(prototype.constructor).get<ISecondaryIndex[]>(symbols.globalIndexes)
            let isEqual = false
            finalize(prototype, key)
            secondaryIndex.KeySchema![index] = { AttributeName: key, KeyType: index ? 'RANGE' : 'HASH' }
            if (!props?.name) this.name += index ? '.sk' : '.pk'
            if (globalIndexes) for (const globalIndex of globalIndexes) {
                if (globalIndex.IndexName === secondaryIndex.IndexName && globalIndex.KeySchema) {
                    globalIndex.KeySchema[index] = secondaryIndex.KeySchema![index]
                    isEqual = true
                }
            }
            if (!isEqual && IndexesWM(this).get<boolean>('isValid')) addToPrivateMapArray(TablesWM, prototype.constructor, symbols.globalIndexes, secondaryIndex)
        }
        this.#hashKey = addIndex(0)
        this.#rangeKey = addIndex(1)
    }
}

export function Local<T>(name: string) {
    return new LocalSecondaryIndex({ name })
}

export function Global<T>(name: string) {
    return new GlobalSecondaryIndex({ name })
}