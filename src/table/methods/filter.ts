import {Query, Scan} from 'src/commands'
import {Class, Condition, QueryObject} from 'src/types'
import {Dynam0RMTable} from 'src/table'

function commands<T extends Dynam0RMTable>(constructor: Class<T>, conditions: Condition<T>[]) {
    return {
        query: (hashValue: string | number, query?: QueryObject<string | number>) => ({
            scanForward: (Limit?: number) => new Query(constructor, hashValue, query, conditions, {ScanIndexForward: true, Limit}).send(),
            scanBackward: (Limit?: number) => new Query(constructor, hashValue, query, conditions, {ScanIndexForward: false, Limit}).send()
        }),
        scan: (Limit?: number) => new Scan<T>(constructor, conditions, {Limit}).send(),
    }
}

function orLoop<T extends Dynam0RMTable>(constructor: Class<T>, conditions: Condition<T>[]) {
    return {
        ...commands(constructor, conditions),
        or(condition: Condition<T>) {
            conditions.push(condition)
            return {...orLoop(constructor, conditions)}
        }
    }
}

export function filterMethods<T extends Dynam0RMTable>(constructor: Class<T>, conditions: Condition<T>[]) {
    return {
        ...commands(constructor, conditions),
        ...orLoop(constructor, conditions)
    }
}