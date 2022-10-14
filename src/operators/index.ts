import { Size } from "src/types"
import { AttributeTypes } from "src/definitions/attributes"
import * as symbols from "src/definitions/symbols"

export function attribute_exists(value: boolean) {
    return { [symbols.attributeExists]: value }
}
export function attribute_type(value: AttributeTypes) {
    return { [symbols.attributeType]: value}
}
export function contains<T>(value: T) {
    return { [symbols.contains]: value }
}
export function begins_with(value: string) {
    return { [symbols.beginsWith]: value }
}
export function In<T>(...values: T[]) {
    return { [symbols.into]: values }
}
export function between<T>(start: T, end: T): { [symbols.between]: [T,T]} {
    return { [symbols.between]: [start, end] }
}
export function size(value: Size) {
    return { [symbols.size]: value }
}    
export function equal<T>(value: T) {
    return { [symbols.equal]: value }
}
export function not_equal<T>(value: T) {
    return { [symbols.notEqual]: value }
}
export function greater<T extends (string|number)>(value: T) {
    return { [symbols.greater]: value }
}
export function lesser<T extends (string|number)>(value: T) {
    return { [symbols.lesser]: value }
}
export function greater_equal<T extends (string|number)>(value: T) {
    return { [symbols.greaterEqual]: value }
}
export function lesser_equal<T extends (string|number)>(value: T) {
    return { [symbols.lesserEqual]: value }
}
// Update symbols
export function add<T>(...values: T[]) {
    return { [symbols.add]: new Set(values) } as unknown as Set<T>
}
export function increment(value: number) {
    return { [symbols.increment]: value } as unknown as number
}
export function decrement(value: number) {
    return { [symbols.decrement]: value } as unknown as number
}
export function Delete<T>(...values: T[]) {
    return { [symbols.Delete]: new Set(values) } as unknown as Set<T>
}
export function append<T>(...values: T[]) {
    return { [symbols.append]: values } as unknown as T[]
}
export function prepend<T>(...values: T[]) {
    return { [symbols.prepend]: values } as unknown as T[]
}
export function remove() {
    return symbols.remove as any
}

export default { 
    equal, 
    greater, 
    greater_equal, 
    lesser, 
    lesser_equal, 
    begins_with, 
    between,
    contains,
    In,
    not_equal,
    attribute_exists,
    attribute_type,
    size,
    add,
    increment,
    decrement,
    Delete,
    append,
    prepend,
    remove
}
