import { KeySchemaElement } from "@aws-sdk/client-dynamodb"
import { validateType } from "src/validation"
import { mainPM } from "src/private"
import * as symbol from "src/definitions/symbols"

export function extractKeys(constructor: any, element: any): any {
    let keys = {}
        for (const k in element) {
            if (k === mainPM(constructor).get<KeySchemaElement[]>(symbol.keySchema)[0]?.AttributeName  || 
                k === mainPM(constructor).get<KeySchemaElement[]>(symbol.keySchema)[1]?.AttributeName) {
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
        if (k === mainPM(constructor).get<KeySchemaElement[]>(symbol.keySchema)[0]?.AttributeName || 
            k === mainPM(constructor).get<KeySchemaElement[]>(symbol.keySchema)[1]?.AttributeName) {
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
            return Reflect.set(target, key, validateType(key, receiver))
        }
    })
}