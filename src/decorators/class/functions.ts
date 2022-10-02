import { Response } from "../../types"
import { validate } from "./validation"
import * as symbol from "../../definitions/symbols"

export async function response<T>(response: Promise<T>): Promise<Response<T>> {
    try {
        return {
            ok: true, 
            response: await response
        }
    } catch (error: any) {
        return {
            ok: false,
            response: error.message,
            error: error.name
        }
    }
}

export function extractKeys(constructor: any, element: any): any {
    let keys = {}
        for (const k in element) {
            if (k === constructor[symbol.primaryKeys][symbol.partitionKey] || 
                k === constructor[symbol.primaryKeys][symbol.sortKey]) {
                keys = {
                    ...keys,
                    [k]: element[k]
                }
            }
        }
    return keys
}

export function excludeKeys(constructor: any, element: any): any {
    const object = { ...element }
    for (const k in object) {
        if (k === constructor[symbol.primaryKeys][symbol.partitionKey] || k === constructor[symbol.primaryKeys][symbol.sortKey]) {
            delete object[k]
        }
    }
    return object
}

export function constructArray<K, T extends { new (...args: any): K }>(constructor: T, items?: {[k:string]: any}[]) {
    return items?.map((item) => new constructor(item))
}

export function proxy(obj: {[k:string]: any}): typeof Proxy.prototype {
    return new Proxy(obj, {
        get(target, key: string) {
            if (!(key in target) && key !== "then") {
                return target[key] = proxy({})
            }
            return Reflect.get(target, key)
        },
        set(target, key: string, receiver) {
            return Reflect.set(target, key, validate(receiver))
        }
    })
}