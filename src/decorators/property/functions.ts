import { AttributeDefinition } from "@aws-sdk/client-dynamodb"
import { createPrivateMap } from "src/private/weakmaps"
import { checkEquality } from "src/utils"

export function addToPrivateMapArray(pm: ReturnType<typeof createPrivateMap>, constructor: object, key: string|symbol, value: any, index?: number) {
    if (!pm(constructor).has(key)) {
        pm(constructor).set(key, [])
    }
    if (Array.isArray(pm(constructor).get(key))) {
        if (typeof index === 'number') {
            pm(constructor).get(key)[index] = value
        } else {
            let isEqual = false
            for (const item of pm(constructor).get(key)) {
                if (checkEquality(item, value)) isEqual = true
            }
            if (!isEqual) pm(constructor).get(key).push(value)
        }
    }
}

export function attributeDefinition(key: string, type: {}): AttributeDefinition {
    return {
        AttributeName: key,
        AttributeType: type === String ? 'S' : type === Number ? 'N' : undefined
    }
}