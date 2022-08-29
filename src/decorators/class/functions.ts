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

export function construct(constructor: any, items: any): any {
    return items?.map((item: any) => new constructor(item))
}