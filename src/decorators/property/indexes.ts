import 'reflect-metadata'
import { GlobalSecondaryIndex, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { attributeDefinition, addToPrivateMapArray } from './functions'
import { validateKeyDecorator } from 'src/validation'
import { Response } from 'src/commands/command'
import { Scan } from 'src/commands'
import { Valueof } from 'src/types'
import { mainPM, indexPM } from 'src/private'
import * as symbol from 'src/private/symbols'


type OnlyKeys<T> = Valueof<{ [K in keyof T]: T[K] extends Function ? never : K }>

type PropertyDecorator = (prototype: any, key: string) => void

type DecoratorMaker = (fn: PropertyDecorator) => PropertyDecorator

interface IndexProps<T> {
    name?: string, 
    attributes?: (OnlyKeys<T>)[] | 'keys-only'
}

interface GlobalIndexProps<T> extends IndexProps<T> {
    throughput?: {
        read: number
        write: number
    }
}

const secondaryIndex = Symbol()
const makeDecorator = Symbol()

abstract class SecondaryIndex<T> {
    public name: string
    protected constructor(kind: 'local'|'global', props?: GlobalIndexProps<T>) {
        const _secondaryIndex = indexPM(this).set<GlobalSecondaryIndex>(secondaryIndex, {
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
            _secondaryIndex.ProvisionedThroughput = {
                ReadCapacityUnits: props.throughput.read,
                WriteCapacityUnits: props.throughput.write
            }
        }
        _secondaryIndex.Projection = (function() {
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
        const _makeDecorator: DecoratorMaker = (fn) => (prototype, key) => {
            const type = validateKeyDecorator(prototype.constructor, key)
            const symbolIndex = kind === 'local' ? symbol.localIndexes : symbol.globalIndexes
            fn(prototype, key)
            if (!props?.name) this.name += `.${key}`
            _secondaryIndex.IndexName = this.name
            addToPrivateMapArray(mainPM, prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
            addToPrivateMapArray(mainPM, prototype.constructor, symbolIndex, _secondaryIndex)
            try {
                Object.defineProperty(this, 'scan', {
                    value: async (Limit?: number) => new Scan(prototype.constructor, { Limit, IndexName: this.name }).exec(),
                    enumerable: true 
                })
            } catch {}
        }
        indexPM(this).set<DecoratorMaker>(makeDecorator, _makeDecorator)
    }
    public async scan(limit?: number): Promise<Response<T[]>> { 
        throw Error('This index has not yet been assigned to any attribute.')
    }
}

export class localSecondaryIndex<T> extends SecondaryIndex<T> {
    public readonly sortKey: PropertyDecorator
    public constructor(props?: IndexProps<T>) {
        super('local', props)
        const _makeDecorator = indexPM(this).get<DecoratorMaker>(makeDecorator)!
        this.sortKey = _makeDecorator((prototype, key) => {
            const keySchema = mainPM(prototype.constructor).get(symbol.keySchema)
            indexPM(this).get<GlobalSecondaryIndex>(secondaryIndex)?.KeySchema?.push(
                {
                    AttributeName: (keySchema && keySchema[0]?.AttributeName) ?? undefined,
                    KeyType: 'HASH'
                },
                {
                    AttributeName: key,
                    KeyType: 'RANGE'
                }
            )
        })
        Object.defineProperty(this, 'sortKey', {
            enumerable: true,
            writable: false,
            configurable: false
        })
    }
}

export class globalSecondaryIndex<T> extends SecondaryIndex<T> {
    public readonly partitionKey: PropertyDecorator
    public readonly sortKey: PropertyDecorator
    constructor(props?: GlobalIndexProps<T>) {
        super('global', props)
        const _makeDecorator = indexPM(this).get<DecoratorMaker>(makeDecorator)!
        this.partitionKey = _makeDecorator((prototype, key) => {
            indexPM(this).get<GlobalSecondaryIndex>(secondaryIndex)?.KeySchema?.splice(0, 0, {
                AttributeName: key,
                KeyType: 'HASH'
            })
            if (!props?.name) this.name += '.pk'
        })
        this.sortKey = _makeDecorator((prototype, key) => {
            indexPM(this).get<GlobalSecondaryIndex>(secondaryIndex)?.KeySchema?.splice(1, 0, {
                AttributeName: key,
                KeyType: 'RANGE'
            })
            if (!props?.name) this.name += '.sk'
        })
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