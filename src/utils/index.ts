import { JSObject } from 'src/types'

/** Splits an array into arrays of length defined by @param: `maxLength`  */
export function splitToChunks<T>(array: T[], maxLength: number): T[][] {
    if (array.length > maxLength) {
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += maxLength) {
            chunks.push(array.slice(i, i + maxLength))
        }
        return chunks
    }
    return [array]
}

/** Extracts all the property keys from an object and its nested object properties to an array */
export function propsToArray(obj: JSObject): string[] {
    const attributes: string[] = []
    void (function add(obj) {
        for (const [k,v] of Object.entries(obj)) {
            attributes.push(k)
            if (isObject(v)) {
                add(v)
            }
        }
    })(obj)
    return attributes
}

/** Checks if a value is a Javascript Object, excluding most native objects like `Array`, `Set`, `Map` etc. */
export function isObject<T extends JSObject>(obj: any): obj is T {
    return typeof obj === 'object' &&
        obj !== null &&
        !(
            obj instanceof Array || obj instanceof Uint8Array ||
            obj instanceof Set || obj instanceof WeakSet ||
            obj instanceof Map || obj instanceof WeakMap ||
            obj instanceof Number || obj instanceof String ||
            obj instanceof Boolean || obj instanceof Symbol
        )
}

/** Checks if two Javascript objects or arrays have the same properties and values */
export function checkEquality<T>(A: T, B: T): boolean {
    let equality = true
    void (function compare(a: T, b: T): false | void {
        if (isObject(a) && isObject(b)) {
            for (const [kA, vA] of Object.entries(a)) {
                if (!(kA in b)) {
                    return equality = false
                }
                for (const [kB, vB] of Object.entries(b)) {
                    if (!(kB in a)) {
                        return equality = false
                    }
                    if (kA === kB) {
                        compare(vA, vB)
                    }
                }
            }
        } else if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
                return equality = false
            }
            for (let i = 0; i < a.length; i++) {
                compare(a[i], b[i])
            }
        } else if (a !== b) {
            return equality = false
        }
    })(A, B)
    return equality
}

export function recursiveFreeze<T extends JSObject>(target: T) {
    if (!Object.isFrozen(target)) Object.freeze(target)
    for (const key of Reflect.ownKeys(target)) {
        if (isObject(target[key])) {
            recursiveFreeze(target[key])
        }
    }
    return target
}

export function removeUndefined<T extends JSObject>(target: T) {
    if (isObject(target)) {
        for (const key of Reflect.ownKeys(target)) {
            if (target[key] === undefined) {
                delete target[key]
            } else if (isObject(target[key])) {
                removeUndefined(target[key])
            }
        }
    }
    return target
}

export function makeRange(from: number, to: number) {
    if (to > from) return [...Array(++to - from).keys()].map(i => i + from)
    return []
}