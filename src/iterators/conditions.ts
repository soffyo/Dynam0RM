import { JSObject } from 'src/types'
import { isObject } from 'src/utils'
import { handleConditions } from 'src/generators'
import * as symbols from 'src/private/symbols'

export function iterateConditions(target: JSObject, paths: string[], ExpressionAttributeNames: {}, ExpressionAttributeValues: {}, Expressions: string[]) {
    for (const key of Reflect.ownKeys(target)) {
        const value = target[key]
        let path = paths
        if (typeof key === 'string') {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            path = paths.length > 0 ? [...paths, key] : [key]
            if (isObject(value)) {
                iterateConditions(value, path, ExpressionAttributeNames, ExpressionAttributeValues, Expressions)
            }
        } else if (typeof key === 'symbol' && Object.keys(symbols.condition).some(v => (symbols.condition as any)[v] === key)) {
            handleConditions(key, value, path, ExpressionAttributeValues, Expressions)
        } 
    }
}