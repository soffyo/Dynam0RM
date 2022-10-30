import { Size as TSize } from 'src/types'
import { AttributeTypes } from 'src/definitions/attributes'
import * as symbols from 'src/private/symbols'

export function AttributeExists(value: boolean) {
    return { [symbols.attributeExists]: value }
}
export function AttributeType(value: AttributeTypes) {
    return { [symbols.attributeType]: value }
}
export function Contains<T>(...values: T[]) {
    return { [symbols.contains]: values }
}
export function BeginsWith(value: string) {
    return { [symbols.beginsWith]: value }
}
export function In<T>(...values: T[]) {
    return { [symbols.into]: values }
}
export function Between<T>(start: T, end: T): { [symbols.between]: [T,T] } {
    return { [symbols.between]: [start, end] }
}
export function Size(value: TSize) {
    return { [symbols.size]: value }
}    
export function Equal<T>(value: T) {
    return { [symbols.equal]: value }
}
export function NotEqual<T>(value: T) {
    return { [symbols.notEqual]: value }
}
export function Greater<T extends (string|number)>(value: T) {
    return { [symbols.greater]: value }
}
export function Lesser<T extends (string|number)>(value: T) {
    return { [symbols.lesser]: value }
}
export function GreaterEqual<T extends (string|number)>(value: T) {
    return { [symbols.greaterEqual]: value }
}
export function LesserEqual<T extends (string|number)>(value: T) {
    return { [symbols.lesserEqual]: value }
}
// Update symbols
export function Overwrite<T>(value: T) {
    return {[symbols.overwrite]: value}
}
export function Add<X, T extends Set<X>>(...values: X[]) {
    return { [symbols.add]: new Set(values) }
}
export function Increment(value: number) {
    return { [symbols.increment]: value }
}
export function Decrement(value: number) {
    return { [symbols.decrement]: value }
}
export function Delete<T>(...values: T[]) {
    return { [symbols.Delete]: new Set(values) }
}
export function Append<T>(...values: T[]) {
    return { [symbols.append]: values }
}
export function Prepend<T>(...values: T[]) {
    return { [symbols.prepend]: values }
}
export function Remove(): typeof symbols.remove {
    return symbols.remove
}

export const Query = {BeginsWith, Between, Equal, NotEqual, Greater, Lesser, GreaterEqual, LesserEqual}
export const Condition = {...Query, AttributeExists, AttributeType, Contains, In, Size}
export const Update = {
    Sets: {Add, Delete},
    Arrays: {Append, Prepend},
    Numbers: {Increment, Decrement},
    Overwrite,
    Remove
}

export default {
    Equal,
    Greater,
    GreaterEqual,
    Lesser,
    LesserEqual,
    BeginsWith,
    Between,
    Contains,
    In,
    NotEqual,
    AttributeExists,
    AttributeType,
    Size,
    Add,
    Increment,
    Decrement,
    Delete,
    Append,
    Prepend,
    Remove,
    Overwrite
}


