import { AttributeTypes } from "../definitions"
import * as symbols from "../definitions/symbols"

// Utility types
type Valueof<T> = T[keyof T]
type Only<T,K extends keyof T> = Pick<T,K> & { [P in Exclude<keyof T,K>]?: never }
export type OmitMethods<T> = { [K in keyof T as T[K] extends Function ? never : K]: T[K] }

export interface Response<T> {
    ok: boolean
    response: T | Error["message"]
    error?: Error["name"]
}

type RawOperator = "="|"<>"|"<"|"<="|">"|">="
export type Size = Valueof<{[K in RawOperator]: {[k in K]-?: number} & {[k in Exclude<RawOperator, K>]+?: never}}>

/** Picks two properties of type (string|number). One is required (partition key) while the other one is optional (sort key).
This approach is temporary until design-time decorator types are implemented: https://github.com/microsoft/TypeScript/issues/48885 */
export type PrimaryKeys<T extends Record<string,any>> = Valueof<{
    [K in keyof OmitMethods<T>]-?: T[K] extends (string|number) ? Only<T,K> | Valueof<{
            [L in Exclude<keyof T,K>]+?: T[L] extends (string|number) ? Only<T,K|L> : never
    }> : never
}>

export type Allowed = string | number | boolean | Set<string|number> | Array<string|number> | null | undefined
export type AllowedObject = { [s:string]: Allowed | AllowedObject } | undefined

type ConditionTypes<K extends symbols.QuerySymbols|symbols.ConditionSymbols,V> = K extends typeof symbols.beginsWith ? V extends (string|undefined) ? V : never :
    K extends typeof symbols.between ? V extends (number|undefined) ? [V,V] : never :
    K extends typeof symbols.into ? V[] :
    K extends typeof symbols.contains ? V extends (Array<infer T>|Set<infer T>|undefined) ? T : V extends (string|undefined) ? V : never :
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

export type Update<T> = {
    [K in keyof T]?: T[K] | 
        T[K] extends Set<infer i> ? { add: i } : 
        T[K] extends Array<infer i> ? { append: i } :
        T[K] extends number ? { increment: number }
        : never
}