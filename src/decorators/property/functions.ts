import { AttributeDefinition } from "@aws-sdk/client-dynamodb"

export function addToArraySymbol<T>(target: {[k:symbol|string]: any}, key: symbol|string, value: T) {
    Object.defineProperty(target, key, {
        value: ((): T[] => {
            if (target[key] instanceof Array) {
                let equality = false
                for (const item of target[key]) {
                    if (JSON.stringify(item) === JSON.stringify(value)) equality = true
                }
                if (!equality) {
                    target[key].push(value)
                }
                return target[key]
            } else {
                return [value]
            }
        })(),
        enumerable: false,
        writable: false,
        configurable: false
    })
}

export function addToObjectSymbol(target: {[k:symbol|string]: any}, key: symbol, [k,v]: [string|symbol, string]) {
    Object.defineProperty(target, key, {
        value: ((): any => {
                if (target[key]) {
                    Object.defineProperty(target[key], k, { value: v, enumerable: true })
                    return target[key]
                } else {
                    return {
                        [k]: v
                    }
                }
        })(),
        enumerable: false,
        writable: false,
        configurable: false
    })
}

export function attributeDefinition(key: string, type: {}): AttributeDefinition {
    return {
        AttributeName: key,
        AttributeType: type === String ? "S" : type === Number ? "N" : ""
    }
}

export function validateType<T>(type: any): T {
    const description = (type.name).toLowerCase()
    if (type !== String && type !== Number) {
        throw TypeError(`Primary and Index keys can only have attributes of type "string" or "number" but "${description}" type has been found.`)
    }
    return type
}