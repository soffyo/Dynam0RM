import { query, condition } from "src/private/symbols";

export function isOwnSymbol(symbol: symbol, object: {[k:string]: symbol}) {
    for (const [,v] of Object.entries(object)) {
        if (v === symbol) {
            return true
        }
    }
    return false
}

export function isQuerySymbol(symbol: symbol) {
    return (Object.keys(query) as (keyof typeof query)[]).some(s => query[s] === symbol)
}

export function isConditionSymbol(symbol: symbol) {
    return (Object.keys(condition) as (keyof typeof condition)[]).some(s => condition[s] === symbol)
}