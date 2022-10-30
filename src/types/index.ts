import {AttributeTypes} from 'src/definitions/attributes'
import * as symbols from 'src/private/symbols'

// Utility types
export type Class<T={}> = { new(...args: any[]): T }
export type JSObject<Key extends PropertyKey = PropertyKey, Value = any> = { [P in Key]: Value }
type Valueof<T> = T[keyof T]
type Only<T, K extends keyof T> = Pick<T, K> & { [P in Exclude<keyof T, K>]?: never }
export type OmitMethods<T> = { [K in keyof T as T[K] extends Function ? never : K extends string ? K : never]: T[K] }

export interface CreateTableConfig {
    throughput?: {read: number; write: number}
    infrequent?: boolean
    stream?: 'new' | 'old' | 'both' | 'keys-only'
}

export type Size<RawOperator extends string = ( '<' | '<=' | '=' | '<>' | '>=' | '>')> = Valueof<{
    [K in RawOperator]: { [k in K]-?: number } & { [k in Exclude<RawOperator, K>]+?: never }
}>

/** Picks two properties of type (string|number). One is required (partition key) while the other one is optional (sort key).
 This approach is temporary until design-time decorator types are implemented: https://github.com/microsoft/TypeScript/issues/48885 */
export type PrimaryKey<T> = Valueof<{
    [K in keyof OmitMethods<T>]-?: T[K] extends (string | number) ? Only<T, K> | Valueof<{
        [L in Exclude<keyof T, K>]+?: T[L] extends (string | number) ? Only<T, K | L> : never
    }> : never
}>
/** String property name represents the HashKey (numbers must be declared as strings, e.g '1') and its value(s) represent
    the RangeKey(s). This object must be declared in the following format: `{ [HashKeyValue]: RangeKeyValue | RangeKeyValues[] }`*/
export type PrimaryKeyObject = {[k:string]: string | string[]} | {[k:string]: number | number[]}
export type AllowedScalar = string | number | boolean | Set<string | number> | Array<any> | null | undefined
export type ValidRecord<T> = { [K in keyof OmitMethods<T>]: ValidRecord<T[K]> }

type ConditionTypes<K extends symbol, V> =
    K extends typeof symbols.beginsWith ? V extends (string | undefined) ? V : never :
    K extends typeof symbols.between ? V extends (string | number | undefined) ? [V, V] : never :
    K extends typeof symbols.into ? V[] :
    K extends typeof symbols.contains ? V extends (Array<infer T> | Set<infer T> | undefined) ? T | T[] : V extends (string | undefined) ? V | V[] : never :
    K extends typeof symbols.attributeExists ? boolean :
    K extends typeof symbols.attributeType ? AttributeTypes :
    K extends typeof symbols.size ? Size :
    V

type ObjectConditions = { [symbols.attributeExists]: boolean } | { [symbols.attributeType]: AttributeTypes }

export type Condition<T> = {
    [K in keyof OmitMethods<T>]?:
        T[K] extends AllowedScalar ? { [O in symbols.ConditionSymbols]?: ConditionTypes<O, T[K]> } :
        T[K] extends JSObject ? ObjectConditions | Condition<T[K]> :
        never
}

export type QueryObject<T> = Valueof<{
    [S in symbols.QuerySymbols]: Valueof<{
        [N in Exclude<symbols.QuerySymbols, S>]:
            { [_ in S]-?: ConditionTypes<S, T> } &
            { [_ in N]+?: never }
    }>
}>

export type Query<T> = Valueof<{
    [PK in keyof T as T[PK] extends (string | number) ? PK : never]: Valueof<{
        [SK in keyof T as T[SK] extends (string | number) ? SK extends PK ? never : SK : never]:
        { [_ in PK]-?: T[PK] } &
        { [_ in SK]+?: QueryObject<T[SK]> } &
        { [_ in Exclude<keyof T, (PK | SK)>]+?: never }
    }>
}>

export type Update<T> = {
    [K in keyof OmitMethods<T>]?: T[K] extends AllowedScalar ?
    { [symbols.overwrite]: T[K]} |
    typeof symbols.remove |
    (
        T[K] extends Set<infer S> ? { [K in (typeof symbols.update.add | typeof symbols.update.delete)]: Set<S> } :
        T[K] extends Array<infer S> ? { [K in (typeof symbols.update.append | typeof symbols.update.prepend)]: S[] } :
        T[K] extends number ? { [K in (typeof symbols.update.increment | typeof symbols.update.decrement)]: number } :
        never
    )
    : T[K] extends JSObject ? Update<T[K]> | typeof symbols.remove
    : never
}