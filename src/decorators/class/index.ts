import "reflect-metadata"
import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { initialize, drop, put, Delete, get, scan, update, save, query } from "../../methods"
import { extractKeys, excludeKeys, response, construct, object } from "./functions"

export interface Dynam0RXProperties {
    _dynam0rx_client: DynamoDBDocumentClient
    _dynam0rx_tableName: string
    _dynam0rx_partitionKey: {
        name: string,
        type: string
    }
    _dynam0rx_sortKey: {
        name: string,
        type: string
    }
}

/**
 * Decorator for Dynam0RX
 * @param input 
 * @returns 
 */
export function Schema(input?: { tableName?: string, dynamoDBConfig?: DynamoDBClientConfig }) {
    return function<T extends { new (...args: any[]): {} }>(constructor: T) {
        Object.defineProperties(constructor, {
            _dynam0rx_tableName: {
                value: input?.tableName ?? constructor.name
            },
            _dynam0rx_client: {
                value: DynamoDBDocumentClient.from(new DynamoDBClient(input?.dynamoDBConfig ?? {}))
            }
        })
        return class Dynam0RXChild extends constructor {
            constructor(...args: any[]) {
                super()
                if (args.length > 1) {
                    throw TypeError("Only one argument allowed")
                }
                if (args[0]){
                    for (const [key,value] of Object.entries(args[0])) {
                        Object.defineProperty(this, key, {
                            value, enumerable: true, writable: true
                        })
                    }
                }
                return object(this)
            }
            static primaryKey(keys: any) {
                for (const k of Object.keys(keys)) {
                    //@ts-ignore-error
                    const pk = constructor._dynam0rx_partitionKey.name, sk = constructor._dynam0rx_sortKey.name, table = constructor._dynam0rx_tableName
                    if (k !== pk && k !==  sk) {
                        throw Error(`Key "${k}" have been used as primary key but table "${table}"'s KeySchema has been setup with partition key: "${pk}"${sk && ', sort key: "' + sk+'"'}`)
                    }
                }
                return new class {
                    attributes = object({})
                    constructor() {
                        Object.defineProperty(this, "attributes", { writable: false })
                    }  
                    async get() {
                        return get(constructor, keys)
                    } 
                    async update(condition?: any) {
                        return response(update<any>(constructor, keys, this.attributes, condition))
                    } 
                    async delete(condition?: any) {
                        return response(Delete(constructor, keys, condition))
                    }
                }
            }
            static async init() {
                return response(initialize(constructor))
            }
            static async drop() {
                return response(drop(constructor))
            }
            static async scan(limit?: number) {
                try {
                    return construct(Dynam0RXChild, await scan(constructor, limit))
                } catch (e) {
                    return []
                }
            }
            static async batchPut(elements: any[]) {
                return response(put(constructor, elements))
            }
            static async batchDelete(key: any[]) {
                const primaryKeys = key.map((item: any) => {
                    return extractKeys(constructor, item)
                })
                return response(Delete<any>(constructor, primaryKeys))
            }
            static async batchGet(keys: any[]) {
                try {
                    return construct(Dynam0RXChild, await get<any>(constructor, keys))
                } catch (e) {
                    return []
                }
            }
            static async query(input: any, limit?: number) {
                return construct(Dynam0RXChild, await query(constructor, input, limit))
            }
            async put() {
                return response(put<any>(constructor, this))
            }
            async save() {
                return response(save(constructor, extractKeys(constructor, this), excludeKeys(constructor, this)))
            }
            async delete() {
                return response(Delete(constructor, extractKeys(constructor, this)))
            }
        }
    }
}