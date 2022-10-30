import {query, condition, update, ConditionSymbols, UpdateSymbols} from 'src/private/symbols'
import {JSObject, QueryObject} from 'src/types'

export function isOwnSymbol(key: symbol|string, object: JSObject<string|symbol>): key is keyof typeof object {
    for (const [,v] of Object.entries(object)) if (v === key) return true
    return false
}

export function isQuerySymbol(key: symbol|string): key is keyof QueryObject<any> {
    return typeof key === 'symbol' && (Object.keys(query) as (keyof typeof query)[]).some(s => query[s] === key)
}

export function isConditionSymbol(key: symbol|string): key is ConditionSymbols {
    return typeof key === 'symbol' && (Object.keys(condition) as (keyof typeof condition)[]).some(s => condition[s] === key)
}

export function isUpdateSymbol(key: symbol|string): key is UpdateSymbols {
    return typeof key === 'symbol' && (Object.keys(update) as (keyof typeof update)[]).some(s => update[s] === key)
}