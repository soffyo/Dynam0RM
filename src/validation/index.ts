import { Blob } from 'buffer'
import { isObject } from 'src/utils'

export function validateType<T extends {}>(key: string, value: T) {
    let ok: boolean = false
    void (function recursiveValidation(_value = value) {
        switch (typeof _value) {
            case 'string': 
            case 'number': 
            case 'bigint': 
            case 'boolean': ok = true
                break
            case 'object': 
                if (_value instanceof Array) {
                    for (const item of _value) {
                        recursiveValidation(item)
                    }
                }
                if (_value instanceof Uint8Array || _value instanceof Buffer || _value instanceof Blob) {
                    ok = true
                }
                if (_value instanceof Set) {
                    let strings = false
                    let numbers = false
                    let binary = false
                    for (const item of _value) {
                        if (typeof item === 'string') {
                            strings = true
                        }
                        if (typeof item === 'number' || typeof item === 'bigint') {
                            numbers = true
                        }
                        if (item instanceof Uint8Array || _value instanceof Buffer || _value instanceof Blob) {
                            binary = true
                        }
                    }
                    if ((strings && !numbers && !binary) ||
                        (numbers && !strings && !binary) ||
                        (binary && !strings && !numbers)) {
                        ok = true
                    }
                }
                if (isObject(_value)) {
                    for (const [k,v] of Object.entries(_value)) {
                        if (typeof k === 'symbol') {
                            return
                        } else if (typeof k === 'string') {
                            recursiveValidation(v as any)
                        }
                    }
                    if (Object.keys(_value as {}).length === 0) { 
                        if (_value instanceof Map) {
                            return
                        }
                        ok = true
                    }
                }
                if (_value === null) {
                    ok = true
                }
                break
            default: return ok = false
        }
    })()
    if (ok === false) {
        throw Error(`Invalid type assignment found on key "${key}". "${value.constructor.name}" type is not supported by DynamoDB`)
    }
    return value
}

export function validatePrimaryKey<T extends Object>(type: any): T {
    const description = (type.name).toLowerCase()
    if (type !== String && type !== Number) {
        throw TypeError(`Primary and Index keys can only have attributes of type "string" or "number" but "${description}" type has been found.`)
    }
    return type
}