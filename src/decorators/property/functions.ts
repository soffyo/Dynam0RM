import { AttributeDefinition } from "@aws-sdk/client-dynamodb"
import { PrivateMap, createPrivateMap } from "src/private/weakmaps"

export function addToPrivateMapArray(pm: ReturnType<typeof createPrivateMap>, constructor: object, key: string|symbol, value: any, index?: number) {
    if (!pm(constructor).has(key)) {
        pm(constructor).set(key, [])
    }
    if (typeof index === 'number') {
        pm(constructor).get(key)[index] = value
    } else {
        pm(constructor).get(key).push(value)
    }
}

export function addToPrivateMapObject(pm: PrivateMap, key: string|symbol, [k,value]: [string|symbol, any]) {
    if (pm.has(key)) {
        // todo
    }
}

export function addToArraySymbol<T>(target: {[k:symbol|string]: any}, key: symbol|string, value: T) {
    if (target[key] instanceof Array) {
        let equality = false
        for (const item of target[key]) {
            if (JSON.stringify(item) === JSON.stringify(value)) equality = true
        }
        if (!equality) {
            target[key].push(value)
        }
    } else {
        Object.defineProperty(target, key, { value: [value] })
    }
}

export function addToObjectSymbol(target: {[k:symbol|string]: any}, key: symbol, [k,v]: [string|symbol, string]) {
    if (target[key]) {
        Object.defineProperty(target[key], k, { value: v, enumerable: true })
    } else {
        Object.defineProperty(target, key, {
            value: { [k]: v }
        })
    }
}

export function attributeDefinition(key: string, type: {}): AttributeDefinition {
    return {
        AttributeName: key,
        AttributeType: type === String ? "S" : type === Number ? "N" : ""
    }
}