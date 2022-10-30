import * as symbols from "src/private/symbols"

export function handleUpdates(object: {[key: symbol]: any}, paths: string[], attributeValues: {[k:string]: any }, updateExpressions: { [K in ("add"|"delete"|"remove"|"update")]: string[] }) {
    let attributeName = `#${paths.join('.#')}`
    let attributeValue = `:${paths.join('_')}`
    for (const symbol of Object.getOwnPropertySymbols(object)) {
        const value = object[symbol]
        switch (symbol) {
            case symbols.add:
                attributeValue += '_add'
                updateExpressions.add.push(`${attributeName} ${attributeValue}`)
                break
            case symbols.Delete:
                attributeValue += '_delete'
                updateExpressions.delete.push(`${attributeName} ${attributeValue}`)
                break
            case symbols.append:
                attributeValue += '_append'
                Object.defineProperty(attributeValues, `${attributeValue}_emptyList`, {value: [], enumerable: true})
                updateExpressions.update.push(`${attributeName} = list_append(if_not_exists(${attributeName}, ${attributeValue}_emptyList), ${attributeValue})`)
                break
            case symbols.prepend:
                attributeValue += '_prepend'
                Object.defineProperty(attributeValues, `${attributeValue}_emptyList`, {value: [], enumerable: true})
                updateExpressions.update.push(`${attributeName} = list_append(${attributeValue}, if_not_exists(${attributeName}, ${attributeValue}_emptyList))`)
                break
            case symbols.increment:
                attributeValue += '_increment'
                Object.defineProperty(attributeValues, `${attributeValue}_zero`, {value: 0, enumerable: true})
                updateExpressions.update.push(`${attributeName} = if_not_exists(${attributeName}, ${attributeValue}_zero) + ${attributeValue}`)
                break
            case symbols.decrement:
                attributeValue += '_decrement'
                Object.defineProperty(attributeValues, `${attributeValue}_zero`, {value: 0, enumerable: true})
                updateExpressions.update.push(`${attributeName} = if_not_exists(${attributeName}, ${attributeValue}_zero) - ${attributeValue}`)
                break
            case symbols.overwrite:
                attributeValue += '_overwrite'
                updateExpressions.update.push(`${attributeName} = ${attributeValue}`)
                break
        }
        Object.defineProperty(attributeValues, attributeValue, {value, enumerable: true})
    }
}