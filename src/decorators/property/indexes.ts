import { GlobalSecondaryIndex as ISecondaryIndex } from '@aws-sdk/client-dynamodb'
import { attributeDefinition, addToPrivateMapArray } from './functions'
import { validateKeyDecorator } from 'src/validation'
import { Response } from 'src/commands/command'
import { Scan, Query } from 'src/commands'
import { OmitMethods } from 'src/types'
import { mainPM, indexPM } from 'src/private'
import * as symbols from 'src/private/symbols'

type PropertyDecorator = (prototype: any, key: string) => void

interface IndexProps<T> {
    name?: string,
    attributes?: (keyof OmitMethods<T>)[] | 'keys-only'
}

interface GlobalIndexProps<T> extends IndexProps<T> {
    throughput?: {
        read: number
        write: number
    }
}

const secondaryIndexSYM = Symbol()
const finalizeSYM = Symbol()

abstract class SecondaryIndex<T> {
    public name: string
    protected constructor(kind: 'local'|'global', props?: GlobalIndexProps<T>) {
        const secondaryIndex = indexPM(this).set<ISecondaryIndex>(secondaryIndexSYM, {
            KeySchema: [],
            IndexName: undefined,
            Projection: undefined,
            ProvisionedThroughput: undefined
        })
        if (props?.name) {
            this.name = props.name
        } else {
            this.name = `Dynam0RX.${kind}Index`
        }
        if (kind === 'global' && props?.throughput) {
            secondaryIndex.ProvisionedThroughput = {
                ReadCapacityUnits: props.throughput.read,
                WriteCapacityUnits: props.throughput.write
            }
        }
        secondaryIndex.Projection = (function() {
            let NonKeyAttributes: string[] = []
            let ProjectionType: 'ALL'|'INCLUDE'|'KEYS_ONLY' = 'ALL'
            if (props?.attributes) {
                if (Array.isArray(props.attributes) && props.attributes.length > 0) {
                    ProjectionType = 'INCLUDE'
                    NonKeyAttributes = props.attributes as string[]
                } else if (props.attributes === 'keys-only') {
                    ProjectionType = 'KEYS_ONLY'
                }
            }
            return { ProjectionType, NonKeyAttributes }
        })()
        indexPM(this).set<PropertyDecorator>(finalizeSYM, (prototype, key) => {
            const type = validateKeyDecorator(prototype.constructor, key)
            if (!props?.name) this.name += `.${key}`
            secondaryIndex.IndexName = this.name
            addToPrivateMapArray(mainPM, prototype.constructor, symbols.attributeDefinitions, attributeDefinition(key, type))
            this.scan = function() {
                return new Scan<T>(prototype.constructor).exec()
            }
        })
    }
    public scan(): Promise<Response<Partial<OmitMethods<T>>[]>> {
        throw Error('This index has not yet been assigned to any attribute.')
    }
}

export class LocalSecondaryIndex<T> extends SecondaryIndex<T> {
    public readonly sortKey: PropertyDecorator
    public constructor(props?: IndexProps<T>) {
        super('local', props)
        const secondaryIndex = indexPM(this).get<ISecondaryIndex>(secondaryIndexSYM)
        const finalize = indexPM(this).get<PropertyDecorator>(finalizeSYM)!
        this.sortKey = (prototype, key) => {
            const keySchema = mainPM(prototype.constructor).get(symbols.keySchema)
            indexPM(this).get<ISecondaryIndex>(secondaryIndexSYM)?.KeySchema?.push(
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
            addToPrivateMapArray(mainPM, prototype.constructor, symbols.localIndexes, secondaryIndex)
        }
        Object.defineProperty(this, 'sortKey', {
            enumerable: true,
            writable: false,
            configurable: false
        })
    }
}

export class GlobalSecondaryIndex<T> extends SecondaryIndex<T> {
    public readonly partitionKey: PropertyDecorator
    public readonly sortKey: PropertyDecorator
    constructor(props?: GlobalIndexProps<T>) {
        super('global', props)
        const secondaryIndex = indexPM(this).get<ISecondaryIndex>(secondaryIndexSYM)!
        const finalize = indexPM(this).get<PropertyDecorator>(finalizeSYM)!
        const addIndex = (index: 0|1): PropertyDecorator => (prototype, key) => {
            let globalIndexes = mainPM(prototype.constructor).get<ISecondaryIndex[]>(symbols.globalIndexes)
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
            if (!isEqual) addToPrivateMapArray(mainPM, prototype.constructor, symbols.globalIndexes, secondaryIndex)
        }
        this.partitionKey = addIndex(0)
        this.sortKey = addIndex(1)
        Object.defineProperties(this, {
            partitionKey: {
                enumerable: true,
                writable: false,
                configurable: false
            },
            sortKey: {
                enumerable: true,
                writable: false,
                configurable: false
            }
        })
    }
}

export function Local<T = any>(name: string) {
    return new LocalSecondaryIndex({ name })
}

export function Global<T>(name: string) {
    return new GlobalSecondaryIndex({ name })
}