import * as symbol from "src/definitions/symbols"

export function handleConditions(key: symbol, value: any, path: string[], attributeValues: {[k:string]: any}, conditionExpressions: string[]) {
    const path_name = path.join(".#")
    const path_value = path.join("_")
    switch (key) {
        case (symbol.between):
            if (value instanceof Array && value.length == 2) {
                let index = 0
                for (const v of value) {
                    Object.defineProperty(attributeValues, `:${path_value}_${index}_condition`, { value: v, enumerable: true })
                    index++
                }
                conditionExpressions.push(`(#${path_name} BETWEEN :${path_value}_0_condition AND :${path_value}_1_condition)`)
            }
            break
        case (symbol.contains):
        case (symbol.beginsWith):
            Object.defineProperty(attributeValues, `:${path_value}_condition`, { value, enumerable: true })
            conditionExpressions.push(`(${Symbol.keyFor(key)}(#${path_name}, :${path_value}_condition))`)
            break
        case (symbol.into):
            if (value instanceof Array) {
                const values: string[] = []
                let index = 0
                for (const v of value) {
                    Object.defineProperty(attributeValues, `:${path_value}_${index}_condition`, { value: v, enumerable: true })
                    values.push(`:${path_value}_${index}_condition`)
                    index++
                }
                conditionExpressions.push(`(#${path_value} IN ${values.join(", ")})`)
            }
            break
        case (symbol.attributeExists):
            if (value) {
                conditionExpressions.push(`(attribute_exists(#${path_name}))`)
            } else {
                conditionExpressions.push(`(attribute_not_exists(#${path_name}))`)
            }
        case (symbol.size):
            // TODO
            break
        default: 
            Object.defineProperty(attributeValues, `:${path_value}_condition`, { value, enumerable: true })
            conditionExpressions.push(`(#${path_name} ${Symbol.keyFor(key)} :${path_value}_condition)`)
            break
    }
}