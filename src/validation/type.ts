import {Buffer, Blob} from 'buffer'
import {isObject} from 'src/utils'
import * as symbols from 'src/private/symbols'

export function validateType<T>(key: string | symbol, value: T) {
    let ok: boolean = false
    void (function recursiveValidation(value) {
        if (typeof key === 'symbol') {
            return
        }
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'bigint':
            case 'boolean':
                ok = true
                break
            case 'symbol':
                if (value === symbols.remove) {
                    ok = true
                }
                break
            case 'object':
                if (value instanceof Array) {
                    if (!value.length) ok = true
                    else for (const item of value) {
                        recursiveValidation(item)
                    }
                }
                if (value instanceof Uint8Array || value instanceof Buffer || value instanceof Blob) {
                    ok = true
                }
                if (value instanceof Set) {
                    let strings = false
                    let numbers = false
                    let binary = false
                    for (const item of value) {
                        if (typeof item === 'string') {
                            strings = true
                        }
                        if (typeof item === 'number' || typeof item === 'bigint') {
                            numbers = true
                        }
                        if (item instanceof Uint8Array || item instanceof Buffer || item instanceof Blob) {
                            binary = true
                        }
                    }
                    if ((strings && !numbers && !binary) ||
                        (numbers && !strings && !binary) ||
                        (binary && !strings && !numbers) ||
                        (!binary && !strings && !numbers)) {
                        ok = true
                    }
                }
                if (isObject(value)) {
                    for (const [, v] of Object.entries(value)) {
                        recursiveValidation(v)
                    }
                    if (Object.keys(value).length === 0) {
                        if (value instanceof Map) {
                            return
                        }
                        ok = true
                    }
                }
                if (value === null) {
                    ok = true
                }
                break
        }
    })(value)
    if (!ok) {
        console.log(value)
        throw Error(`Invalid assignment found on key [${String(key)}]. '${(value as object).constructor.name}' type is not supported by DynamoDB.`)
    }
    return value
}