import * as symbols from "src/private/symbols"

export function handleUpdates(object: { [key: symbol]: any }, paths: string[], attributeValues: {[k:string]: any }, updateExpressions: { [K in ("add"|"delete"|"remove"|"update")]: string[] }) {
    const attributeName = `#${paths.join('.#')}`
    let attributeValue = `:${paths.join('_')}`
    for (const symbol of Object.getOwnPropertySymbols(object)) {
        const value = object[symbol]
        switch (symbol) {
            case symbols.add:
                attributeValue += '_add'
                Object.defineProperty(attributeValues, attributeValue, { value, enumerable: true })
                updateExpressions.add.push(`${attributeName} ${attributeValue}`)
                break
            case symbols.Delete:
                attributeValue += '_delete'
                Object.defineProperty(attributeValues, attributeValue, { value, enumerable: true })
                updateExpressions.delete.push(`${attributeName} ${attributeValue}`)
                break
            case symbols.append:
                attributeValue += '_append'
                Object.defineProperty(attributeValues, attributeValue, { value, enumerable: true })
                updateExpressions.update.push(`${attributeName} = list_append(${attributeName}, ${attributeValue})`)
                break
            case symbols.prepend:
                attributeValue += '_append'
                Object.defineProperty(attributeValues, attributeValue, { value, enumerable: true })
                updateExpressions.update.push(`${attributeName} = list_append(${attributeValue}, ${attributeName})`)
                break
            case symbols.increment:
                attributeValue += '_increment'
                Object.defineProperty(attributeValues, attributeValue, { value, enumerable: true })
                updateExpressions.add.push(`${attributeName} ${attributeValue}`)
                break
            case symbols.decrement:
                attributeValue += '_decrement'
                Object.defineProperty(attributeValues, attributeValue, { value, enumerable: true })
                updateExpressions.update.push(`${attributeName} = ${attributeName} - ${attributeValue}`)
                break
        }
    }
}