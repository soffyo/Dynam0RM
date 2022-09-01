import { Response } from "../../types"

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
            if (k === constructor._dynam0rx_partitionKey.name || 
                k === constructor._dynam0rx_sortKey.name) {
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
        if (k === constructor._dynam0rx_partitionKey.name || k === constructor._dynam0rx_sortKey.name) {
            delete object[k]
        }
    }
    return object
}

export function construct<K, T extends { new (...args: any): K }>(constructor: T, items?: {[k:string]: any}[]): (K[]|undefined) {
    return items?.map((item) => new constructor(item))
}

export function object(obj: {[k:string]: any}): typeof Proxy.prototype {
    function dot(): typeof Proxy.prototype {
        return new Proxy({}, {
            get(target: any, key: any) {
                if (!(key in target)) {
                    return target[key] = dot()
                }
                return Reflect.get(target, key)
            }
        })
    }
    return new Proxy(obj, {
        get(target, key: string) {
            if (!(key in target)) {
                return target[key] = dot()
            }
            return Reflect.get(target, key)
        }
    })
}