import { KeySchemaElement } from '@aws-sdk/client-dynamodb'
import { validateType } from 'src/validation'
import { mainPM } from 'src/private'
import { Class, JsObject } from 'src/types'
import * as symbol from 'src/private/symbols'

export function extractKeys(constructor: Class, element: JsObject): any {
    let keys = {}
        for (const k in element) {
            const keySchema = mainPM(constructor).get<KeySchemaElement[]>(symbol.keySchema)
            if (keySchema && (k === keySchema[0]?.AttributeName  || k === keySchema[1]?.AttributeName)) {
                keys = {
                    ...keys,
                    [k]: element[k]
                }
            }
        }
    return keys
}

export function excludeKeys(constructor: Class, element: any): any {
    const object = { ...element }
    for (const k in object) {
        const keySchema = mainPM(constructor).get<KeySchemaElement[]>(symbol.keySchema)
        if (keySchema && (k === keySchema[0]?.AttributeName ||k === keySchema[1]?.AttributeName)) {
            delete object[k]
        }
    }
    return object
}

export function proxy <T extends object> (obj: any): T {
    return new Proxy <T> (obj, {
        get(target: any, key) {
            if (!(key in target) && key !== 'then' && typeof key === 'string') {
                return target[key] = proxy({})
            }
            return Reflect.get(target, key)
        },
        set(target, key, receiver) {
            return Reflect.set(target, key, validateType(key, receiver))
        }
    })
}