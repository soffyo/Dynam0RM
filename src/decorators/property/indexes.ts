import { LocalSecondaryIndex, GlobalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import * as symbol from '../../definitions/symbols'
import { addToArraySymbol, addToObjectSymbol, validateType, attributeDefinition } from './functions'
import { scan } from '../../commands'

export class localIndex<T> {
    public readonly name: string
    public readonly index: (prototype: any, key: string) => void
    constructor(props?: { name: string, keys_only?: boolean, attributes?: (keyof T)[] }) {
        this.index = (prototype: any, key: string) => {
            const type = validateType(Reflect.getMetadata('design:type', prototype, key))
            const IndexName = props?.name ?? `${key}_localIndex`
            const localSecondaryIndex: LocalSecondaryIndex = {
                IndexName,
                KeySchema: [
                    {
                        AttributeName: prototype.constructor[symbol.primaryKeys][symbol.partitionKey],
                        KeyType: 'HASH'
                    },
                    {
                        AttributeName: key,
                        KeyType: 'RANGE'
                    }
                ],
                Projection: {
                    NonKeyAttributes: props?.attributes as string[] ?? [],
                    ProjectionType: props?.attributes ? 'INCLUDE' : props?.keys_only ? 'KEYS_ONLY' : 'ALL' 
                }
            }
            addToObjectSymbol(prototype.constructor, symbol.primaryKeys, [IndexName, key])
            addToArraySymbol(prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
            addToArraySymbol(prototype.constructor, symbol.localIndexes, localSecondaryIndex)
            Object.defineProperty(this, 'name', { value: IndexName, enumerable: true })
            this.scan = async function(limit?: number) {
                return scan(prototype.constructor, limit, IndexName)
            }
        }
    }
    async scan(limit?: number): Promise<T[]> { 
        throw Error('This index has not yet been assigned to any attribute.')
    }
}

export class globalIndex {
    public readonly partitionKey: (prototype: any, key: string) => void
    public readonly sortKey: (prototype: any, key: string) => void
    constructor(name?: string) {
        const globalIndex: GlobalSecondaryIndex = {
            IndexName: name ?? 'randomName', //<-- implement unique name generation if name is not provided
            KeySchema: [],
            Projection: {
                NonKeyAttributes: [],
                ProjectionType: 'ALL'
            }
        }
        function addToGlobalIndex(prototype: any, AttributeName: string, KeyType: 'HASH'|'RANGE') {
            const globalIndexes = prototype.constructor[symbol.globalIndexes]
            const index = globalIndexes && globalIndexes.indexOf(globalIndex)
            if (index > -1) {
                if (KeyType === 'HASH') {
                    globalIndexes[index].KeySchema.splice(0, 0, { AttributeName, KeyType })
                } else {
                    globalIndexes[index].KeySchema.splice(1, 0, { AttributeName, KeyType })
                }
            } else {
                globalIndex.KeySchema.push({ AttributeName, KeyType })
                addToArraySymbol(prototype.constructor, symbol.globalIndexes, globalIndex)
            }
        }
        Object.defineProperty(this, 'partitionKey', {
            value: function(prototype: any, key: string) {
                const type = validateType(Reflect.getMetadata('design:type', prototype, key))
                addToArraySymbol(prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
                addToGlobalIndex(prototype, key, 'HASH')
            }
        })
        Object.defineProperty(this, 'sortKey', {
            value: function(prototype: any, key: string) {
                const type = validateType(Reflect.getMetadata('design:type', prototype, key))
                addToArraySymbol(prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
                addToGlobalIndex(prototype, key, 'RANGE')
            }
        })
        Object.defineProperty(this, 'name', {
            value: name
        })
    }
}