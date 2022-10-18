/** Splits an array into arrays of lenght defined by @param: `maxLength`  */
export function splitArray<T>(array: T[], maxLength: number): T[][] {
    const main: T[][] = []
    void (function split(array: T[]): void {
        const first = array.slice(0, maxLength)
        const rest = array.slice(maxLength)
        main.push(first)
        if (rest.length > maxLength) {
            return split(rest)
        } else {
            if (rest.length > 0) {
                main.push(rest)
            }
        }
    })(array)
    return main
}

/** Extracts all the property keys from an object and its nested object properties to an array */
export function propsToArray(obj: {[k:string]: any}): string[] {
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
export function isObject<T>(obj: {[k:PropertyKey]: any} | T ): obj is {[k:PropertyKey]: any} {
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