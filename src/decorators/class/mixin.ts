import { initialize, drop, put, Delete, get, scan, update, save, query } from "../../commands"
import { extractKeys, excludeKeys, response, constructArray, proxy } from "./functions"
import { validate } from "./validation"
import { targetConstructor } from "./"
import * as symbol from "../../definitions"

export function Dynam0RXMixin<T extends { new (...args: any[]): {} }>(superclass: T) { 
    return class Dynam0RXInstance extends superclass {
        readonly #proxy = proxy(this)
        constructor(...args: any[]) {
            super()
            if (args.length > 1) {
                throw TypeError("Only one argument allowed")
            }
            if (args[0]){
                for (const [key,value] of Object.entries(args[0])) {
                    Object.defineProperty(this.#proxy, key, {
                        value: validate(value), enumerable: true, writable: true
                    })
                }
            }
            Object.defineProperty(Dynam0RXInstance, "name", { value: targetConstructor.name })
            return this.#proxy
        }
        //@ts-ignore-error
        //static dynamoDB = targetConstructor[symbol.client]
        static primaryKey(keys: any) {
            //@ts-ignore-error
            const pk = targetConstructor[symbol.keySchema][0].AttributeName, sk = targetConstructor[symbol.keySchema][1].AttributeName, table = constructor[symbol.tableName]
            for (const k in keys) {
                if (k !== pk && k !==  sk) {
                    throw Error(`Key "${k}" have been used as primary key but table "${table}"'s KeySchema has been setup with partition key: "${pk}"${sk && ', sort key: "' + sk+'"'}.`)
                }
            }
            return new class {
                //@ts-ignore
                #proxy = proxy({})
                set attributes(v: any) {
                    throw Error(`cannot assign to "attributes" property because it is an internal prop`)
                }
                get attributes() {
                    return this.#proxy
                }
                async get() {
                    try {
                        return new cleanDynam0RX(await get<any>(targetConstructor, keys))
                    } catch (e) {
                        return {} 
                    }
                } 
                async update(condition?: any) {
                    return response(update<any>(targetConstructor, keys, this.attributes, condition))
                } 
                async delete(condition?: any) {
                    return response(Delete(targetConstructor, keys, condition))
                }
            }
        }
        static async init(config?: any) {
            return response(initialize(targetConstructor, config))
        }
        static async drop() {
            return response(drop(targetConstructor))
        }
        static async scan(limit?: number) {
            try {
                return constructArray(cleanDynam0RX, await scan(targetConstructor, limit))
            } catch (e) {
                return []
            }
        }
        static async scanIndex(index: any, limit?: number) {
            try {
                return constructArray(cleanDynam0RX, await scan(targetConstructor, limit, index.name))
            } catch (e) {
                return []
            }
        }
        static async batchPut(elements: any[]) {
            return response(put(targetConstructor, elements))
        }
        static async batchDelete(key: any[]) {
            const primaryKeys = key.map((item: any) => {
                return extractKeys(targetConstructor, item)
            })
            return response(Delete<any>(targetConstructor, primaryKeys))
        }
        static async batchGet(keys: any[]) {
            try {
                return constructArray(cleanDynam0RX, await get<any>(targetConstructor, keys))
            } catch (e) {
                return []
            }
        }
        static async query(input: any, limit?: number) {
            return constructArray(cleanDynam0RX, await query(targetConstructor, input, limit))
        }
        async put() {
            return response(put<any>(targetConstructor, this))
        }
        async save() {
            return response(save(targetConstructor, extractKeys(targetConstructor, this), excludeKeys(targetConstructor, this)))
        }
        async delete() {
            return response(Delete(targetConstructor, extractKeys(targetConstructor, this)))
        }
    }
}

export const cleanDynam0RX = Dynam0RXMixin(class { constructor(arg: any){} })