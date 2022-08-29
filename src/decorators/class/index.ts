import "reflect-metadata"
import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { initialize, drop, put, Delete, get, scan, update, save, query } from "../../methods"
import { extractKeys, excludeKeys, response, construct } from "./functions"

/**
 * Decorator for Dynam0RX
 * @param input 
 * @returns 
 */
export function Schema(input?: { tableName?: string, dynamoDBConfig?: DynamoDBClientConfig }) {
    return function<T extends { new (...args: any[]): {} }>(constructor: T) {
        Object.defineProperties(constructor, {
            _dynam0rx_tableName: {
                value: input?.tableName ? input.tableName : constructor.name
            },
            _dynam0rx_client: {
                value: DynamoDBDocumentClient.from(new DynamoDBClient(input?.dynamoDBConfig!))
            }
        })
        return class Dynam0RXChild extends constructor {
            [s:string|number|symbol]: any
            constructor(...args: any[]) {
                super()
                if (args.length > 1) {
                    throw TypeError("over max arguments")
                }
                if (args[0]){
                    for (const [key,value] of Object.entries(args[0])) {
                        Object.defineProperty(this, key, {
                            value, enumerable: true, writable: true
                        })
                    }
                }
                return new Proxy(this, {
                    set(target, name: string, receiver) {
                        Object.defineProperty(target, name, { value: receiver, enumerable: true, writable: true })
                        return true
                    }
                })
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
                return construct(Dynam0RXChild, await query<any>(constructor, input, limit))
            }
            async put() {
                return response(put<any>(constructor, this))
            }
            async get() {
                return get(constructor, extractKeys(constructor, this))
            } 
            async delete(condition: any) {
                return response(Delete(constructor, extractKeys(constructor, this), condition))
            }
            async save() {
                return response(save(constructor, extractKeys(constructor, this), excludeKeys(constructor, this)))
            }
            async update(condition?: any) {
                return response(update<any>(constructor, extractKeys(constructor, this), excludeKeys(constructor, this), condition))
            }
        }
    }
}