import { AttributeTypes } from "src/definitions/attributes"
import * as symbols from "../private/symbols"

// Utility types
export type Class = { new (...args: any[]) : {} }
export type JsObject<P extends PropertyKey = PropertyKey, V = any> = { [K in P]: V }
export type Valueof<T> = T[keyof T]
export type Only<T,K extends keyof T> = Pick<T,K> & { [P in Exclude<keyof T,K>]?: never }
export type OmitMethods<T> = { [K in keyof T as T[K] extends Function ? never : K]: T[K] }

export interface TableConfig {
    throughput?: {
        read: number,
        write: number
    },
    infrequent?: boolean
}

type RawOperator = "="|"<>"|"<"|"<="|">"|">="
export type Size = Valueof<{[K in RawOperator]: {[k in K]-?: number} & {[k in Exclude<RawOperator, K>]+?: never}}>

/** Picks two properties of type (string|number). One is required (partition key) while the other one is optional (sort key).
This approach is temporary until design-time decorator types are implemented: https://github.com/microsoft/TypeScript/issues/48885 */
export type PrimaryKeys<T> = Valueof<{
    [K in keyof OmitMethods<T>]-?: T[K] extends (string|number) ? Only<T,K> | Valueof<{
            [L in Exclude<keyof T,K>]+?: T[L] extends (string|number) ? Only<T,K|L> : never
    }> : never
}>

export type Allowed = string | number | boolean | Set<string|number> | Array<string|number> | null | undefined
export type AllowedObject = { [s:string]: Allowed | AllowedObject } | undefined

type ConditionTypes<K extends symbols.QuerySymbols|symbols.ConditionSymbols,V> =
    K extends typeof symbols.beginsWith ? V extends (string|undefined) ? V : never :
    K extends typeof symbols.between ? V extends (number|undefined) ? [V,V] : never :
    K extends typeof symbols.into ? V[] :
    K extends typeof symbols.contains ? V extends (Array<infer T>|Set<infer T>|undefined) ? T|T[] : V extends (string|undefined) ? V|V[] : never :
    K extends typeof symbols.attributeExists ? boolean :
    K extends typeof symbols.attributeType ? AttributeTypes :
    K extends typeof symbols.size ? Size 
    : V

type ObjectConditions = {[K in typeof symbols.attributeExists]: boolean } | {[K in typeof symbols.attributeType]: AttributeTypes }

export type Condition<T> = { 
    [K in keyof OmitMethods<T>]?: T[K] extends Allowed ? {
        [O in symbols.ConditionSymbols|symbols.QuerySymbols]?: ConditionTypes<O,T[K]>
    } : T[K] extends AllowedObject ? ObjectConditions | Condition<T[K]> : never
}

type QueryObject<T> = Valueof<{
    [S in symbols.QuerySymbols]: Valueof<{
        [N in Exclude<symbols.QuerySymbols,S>]: 
        { [_ in S]-?: ConditionTypes<S,T> } &
        { [_ in N]+?: never }
    }>
}>

export type Query<T> = Valueof<{ 
    [PK in keyof T as T[PK] extends (string|number) ? PK : never]: Valueof<{
        [SK in keyof T as T[SK] extends (string|number) ? SK extends PK ? never : SK : never]: 
        { [_ in PK]-?: T[PK] } & 
        { [_ in SK]+?: QueryObject<T[SK]> } &
        { [_ in Exclude<keyof T,(PK|SK)>]+?: never } 
    }> 
}>

export type QueryWithFilters<T> = Valueof<{ 
    [PK in keyof T as T[PK] extends (string|number) ? PK : never]:
        { [X in PK]-?: T[PK] } & 
        { [X in Exclude<keyof T, PK>]+?: QueryObject<T[X]> } 
}>

export type Update<T> = {
    [K in keyof T]?: T[K] extends AllowedObject ? Update<T[K]> : T[K] | typeof symbols.remove |
    (
        T[K] extends Set<infer S> ? { [K in (typeof symbols.update.add | typeof symbols.update.delete)]: Set<S> } :
        T[K] extends Array<infer S> ? { [K in (typeof symbols.update.append | typeof symbols.update.prepend)]: S[] } :
        T[K] extends number ? { [K in (typeof symbols.update.increment | typeof symbols.update.decrement)]: number }
        : never
    )
}