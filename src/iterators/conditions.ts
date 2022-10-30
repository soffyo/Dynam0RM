import {JSObject} from 'src/types'
import {isObject} from 'src/utils'
import {handleConditions} from 'src/generators'
import {isConditionSymbol} from 'src/validation'

function iterateConditions(condition: JSObject, paths: string[], ExpressionAttributeNames: JSObject<string,string>, ExpressionAttributeValues: JSObject<string>, Expressions: string[]) {
    for (const key of Reflect.ownKeys(condition)) {
        let value = condition[key]
        let path = paths
        if (typeof key === 'string') {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            path = paths.length ? [...paths, key] : [key]
            if (isObject(value)) iterateConditions(value, path, ExpressionAttributeNames, ExpressionAttributeValues, Expressions)
        } else if (isConditionSymbol(key)) handleConditions(key, value, path, ExpressionAttributeValues, Expressions)
    }
}

export function iterateConditionsArray(conditions: JSObject[], paths: string[], ExpressionAttributeNames: JSObject, ExpressionAttributeValues: JSObject, Expressions: string[][]) {
    for (const condition of conditions) {
        const ExpressionsBlock: string[] = []
        iterateConditions(condition, paths, ExpressionAttributeNames, ExpressionAttributeValues, ExpressionsBlock)
        Expressions.push(ExpressionsBlock)
    }
}