import { QuerySymbols, ConditionSymbols } from 'src/private/symbols'
import {formatAttributeType} from 'src/definitions/attributes'
import * as symbols from 'src/private/symbols'
import {JSObject} from "src/types";

export function handleConditions(key: symbol, value: any, path: string[], attributeValues: JSObject<string>, conditionExpressions: string[]) {
    const attributeName = '#' + path.join(".#")
    const attributeValue = (...suffixes: (string|number)[]) => {
        let value = ':' + path.join("_")
        if (suffixes.length) value += '_' + suffixes.join('_')
        for (const k in attributeValues) {
            if (value === k) {
                const i = k.match(/\d$/)?.index
                value = i ? k.slice(0, i) + (+k.slice(i) + 1) : `${value}_1`
            }
        }
        return value
    }
    switch (key) {
        case (symbols.between):
            if (value instanceof Array && value.length === 2) {
                const _attributeValues: [string?, string?] = []
                let index = 0
                for (const v of value) {
                    const _attributeValue = attributeValue(index, 'between')
                    Object.defineProperty(attributeValues, _attributeValue, { value: v, enumerable: true })
                    _attributeValues.push(_attributeValue)
                    index++
                }
                conditionExpressions.push(`${attributeName} BETWEEN ${_attributeValues[0]} AND ${_attributeValues[1]}`)
            }
            break
        case (symbols.contains):
            if (value instanceof Array) {
                let index = 0
                for (const v of value) {
                    const _attributeValue = attributeValue(index, 'contains')
                    Object.defineProperty(attributeValues, _attributeValue, { value: v, enumerable: true })
                    conditionExpressions.push(`contains(${attributeName}, ${_attributeValue})`)
                    index++
                }
            }
            break
        case (symbols.beginsWith): {
            const _attributeValue = attributeValue('beginsWith')
            Object.defineProperty(attributeValues, _attributeValue, { value, enumerable: true })
            conditionExpressions.push(`${Symbol.keyFor(key)}(${attributeName}, ${_attributeValue})`)
            break
        }
        case (symbols.into):
            if (value instanceof Array) {
                const _attributeValues: string[] = []
                let index = 0
                for (const v of value) {
                    const _attributeValue = attributeValue(index, 'in')
                    Object.defineProperty(attributeValues, _attributeValue, { value: v, enumerable: true })
                    _attributeValues.push(_attributeValue)
                    index++
                }
                conditionExpressions.push(`${attributeName} IN (${_attributeValues.join(', ')})`)
            }
            break
        case symbols.attributeExists:
            if (value) {
                conditionExpressions.push(`attribute_exists(${attributeName})`)
            } else {
                conditionExpressions.push(`attribute_not_exists(${attributeName})`)
            }
            break
        case symbols.attributeType: {
            const _attributeValue = attributeValue('attributeType')
            Object.defineProperty(attributeValues, _attributeValue, { value: formatAttributeType(value), enumerable: true })
            conditionExpressions.push(`attribute_type(${attributeName}, ${_attributeValue})`)
            break
        }
        case symbols.size:
            // TODO
            break
        default: {
            const _attributeValue = attributeValue('condition')
            Object.defineProperty(attributeValues, _attributeValue, { value, enumerable: true })
            conditionExpressions.push(`${attributeName} ${Symbol.keyFor(key)} ${_attributeValue}`)
            break
        }
    }
}