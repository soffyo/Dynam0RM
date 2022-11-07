import {AttributeTypes} from './definitions/attributes'
import {Size as TSize} from './types'
import * as operators from './operators'
import * as symbols from './private/symbols'

declare global {
    // Update
    var Remove: (() => typeof symbols.remove) | null
    var Overwrite: (<T>(value: T) => {[symbols.overwrite]: T}) | null
    var Increment: ((value: number) => { [symbols.increment]: number }) | null
    var Decrement: ((value: number) => { [symbols.decrement]: number }) | null
    var AddToSet: (<T>(...values: T[]) => {[symbols.add]: Set<T>}) | null
    var DeleteFromSet: (<T>(...values: T[]) => {[symbols.Delete]: Set<T>}) | null
    var AppendToArray: (<T>(...values: T[]) => {[symbols.append]: T[]}) | null
    var PrependToArray: (<T>(...values: T[]) => {[symbols.prepend]: T[]}) | null
    // Query/Condition
    var BeginsWith: ((value: string) => {[symbols.beginsWith]: string}) | null
    var Between: (<T extends string | number>(start: T, end: T) => {[symbols.between]: [T,T]}) | null
    var Equal: (<T>(value: T) => {[symbols.equal]: T}) | null
    var NotEqual: (<T>(value: T) => {[symbols.notEqual]: T}) | null
    var Greater: (<T extends string | number>(value: T) => {[symbols.greater]: T}) | null
    var GreaterEqual: (<T extends string | number>(value: T) => {[symbols.greaterEqual]: T}) | null
    var Lesser: (<T extends string | number>(value: T) => {[symbols.lesser]: T}) | null
    var LesserEqual: (<T extends string | number>(value: T) => {[symbols.lesserEqual]: T}) | null
    // Condition
    var AttributeExists: ((value: boolean) => {[symbols.attributeExists]: boolean}) | null
    var AttributeType: ((value: AttributeTypes) => {[symbols.attributeType]: AttributeTypes}) | null
    var Contains: (<T>(...values: T[]) => {[symbols.contains]: T[]}) | null
    var In: (<T>(...values: T[]) => {[symbols.into]: T[]}) | null
    var Size: ((value: TSize) => {[symbols.size]: TSize}) | null
}

export function registerGlobalOperators(globalObject: {[k:string]: any} = global) {
    globalObject.Overwrite = operators.Overwrite
    globalObject.Remove = operators.Remove
    globalObject.AddToSet = operators.Add
    globalObject.Increment = operators.Increment
    globalObject.Decrement = operators.Decrement
    globalObject.DeleteFromSet = operators.Delete
    globalObject.AppendToArray = operators.Append
    globalObject.PrependToArray = operators.Prepend
    globalObject.BeginsWith = operators.BeginsWith
    globalObject.Between = operators.Between
    globalObject.Equal = operators.Equal
    globalObject.NotEqual = operators.NotEqual
    globalObject.Greater = operators.Greater
    globalObject.Lesser = operators.Lesser
    globalObject.GreaterEqual = operators.GreaterEqual
    globalObject.LesserEqual = operators.LesserEqual
    globalObject.AttributeExists = operators.AttributeExists
    globalObject.AttributeType = operators.AttributeType
    globalObject.Contains = operators.Contains
    globalObject.In = operators.In
    globalObject.Size = operators.Size
}

export function unregisterGlobalOperators(globalObject: {[k:string]: any} = global) {
    globalObject.Overwrite = null
    globalObject.Remove = null
    globalObject.AddToSet = null
    globalObject.Increment = null
    globalObject.Decrement = null
    globalObject.DeleteFromSet = null
    globalObject.AppendToArray = null
    globalObject.PrependToArray = null
    globalObject.BeginsWith = null
    globalObject.Between = null
    globalObject.Equal = null
    globalObject.NotEqual = null
    globalObject.Greater = null
    globalObject.Lesser = null
    globalObject.GreaterEqual = null
    globalObject.LesserEqual = null
    globalObject.AttributeExists = null
    globalObject.AttributeType = null
    globalObject.Contains = null
    globalObject.In = null
    globalObject.Size = null
}
