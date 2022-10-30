import {Buffer, Blob} from 'buffer'
import {isObject} from 'src/utils'
import {remove} from 'src/private/symbols'

export function validateType(value: any): boolean {
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'bigint':
        case 'boolean':
            return true
        case 'symbol':
            if (value === remove) {
                return true
            }
            break
        case 'object':
            if (value instanceof Array) {
                if (!value.length) {
                    return true
                } else if (value.every(i => validateType(i))) {
                    return true
                }
            }
            if (value instanceof Uint8Array ||
                value instanceof Buffer ||
                value instanceof Blob) {
                return true
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
                    return true
                }
            }
            if (isObject(value)) {
                if (!Object.keys(value).length) {
                    return true
                }
                if (Object.entries(value).every(([,v]) => validateType(v))) {
                    return true
                }
            }
            if (value === null) {
                return true
            }
            break
        }
    return false
}