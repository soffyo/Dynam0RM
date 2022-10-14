import 'reflect-metadata'
import { GlobalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { attributeDefinition, addToPrivateMapArray } from './functions'
import { validatePrimaryKey } from 'src/validation'
import { Response } from 'src/commands/command'
import { Scan } from 'src/commands'
import { Valueof } from 'src/types'
import { mainPM } from 'src/private'
import * as symbol from 'src/definitions/symbols'


type OnlyKeys<T> = Valueof<{ [K in keyof T]: T[K] extends Function ? never : K }>

type PropertyDecorator = (prototype: any, key: string) => void

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

class SecondaryIndex<T> {
    public name: string
    protected readonly [makeDecorator]: (fn: PropertyDecorator) => PropertyDecorator
    protected readonly [secondaryIndex]: GlobalSecondaryIndex = { 
        KeySchema: [], 
        IndexName: undefined, 
        Projection: undefined, 
        ProvisionedThroughput: undefined 
    }
    constructor(kind: 'local'|'global', props?: GlobalIndexProps<T>) {
        if (props?.name) {
            this.name = props.name
        } else {
            this.name = `Dynam0RX.${kind}Index`
        }
        if (kind === 'global' && props?.throughput) {
            this[secondaryIndex].ProvisionedThroughput = {
                ReadCapacityUnits: props.throughput.read,
                WriteCapacityUnits: props.throughput.write
            }
        }
        this[secondaryIndex].Projection = (function() {
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
        this[makeDecorator] = (fn) => (prototype, key) => {
            const type = validatePrimaryKey(Reflect.getMetadata('design:type', prototype, key))
            const symbolIndex = kind === 'local' ? symbol.localIndexes :  symbol.globalIndexes
            fn(prototype, key)
            if (!props?.name) { 
                this.name += `.${key}`
            }
            this[secondaryIndex].IndexName = this.name
            addToPrivateMapArray(mainPM, prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
            addToPrivateMapArray(mainPM, prototype.constructor, symbolIndex, this[secondaryIndex])
            try {
                Object.defineProperty(this, 'scan', {
                    value: async (Limit?: number) => new Scan({ Limit, IndexName: this.name }).exec(), 
                    enumerable: true 
                })
            } catch {}
        }
    }
    public async scan(limit?: number): Promise<Response<T[]>> { 
        throw Error('This index has not yet been assigned to any attribute.')
    }
}

export class localSecondaryIndex<T> extends SecondaryIndex<T> {
    //public readonly sortKey: PropertyDecorator
    constructor(props?: IndexProps<T>) {
        super('local', props)
        const decorator = this[makeDecorator]((prototype, key) => {
            const keySchema = mainPM(prototype.constructor).get(symbol.keySchema)
            this[secondaryIndex]?.KeySchema?.push(
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
            value: decorator,
            enumerable: true,
            writable: false,
            configurable: false
        })
    }
    sortKey(): PropertyDecorator {
        throw Error('"sortKey" cannot be called directly. This function mut be used as a property decorator')
    }
}

export class globalSecondaryIndex<T> extends SecondaryIndex<T> {
    public readonly partitionKey: PropertyDecorator
    public readonly sortKey: PropertyDecorator
    constructor(props?: GlobalIndexProps<T>) {
        super('global', props)
        this.partitionKey = this[makeDecorator]((prototype, key) => {
            this[secondaryIndex]?.KeySchema?.splice(0, 0, {
                AttributeName: key,
                KeyType: 'HASH'
            })
            if (!props?.name) this.name += '.pk'
        })
        this.sortKey = this[makeDecorator]((prototype, key) => {
            this[secondaryIndex]?.KeySchema?.splice(1, 0, {
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