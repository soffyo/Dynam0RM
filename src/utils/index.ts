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

export function propsToArray(obj: Record<string,any>): string[] { 
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

export function isObject(obj: any): boolean {
    if (typeof obj === 'object' && obj !== null && !(obj instanceof Array) && !(obj instanceof Set)) {
        return true
    }
    return false
}