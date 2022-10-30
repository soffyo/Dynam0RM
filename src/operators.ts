import {AttributeTypes} from 'src/definitions/attributes'
import {Size as TSize} from 'src/types'
import * as operators from 'src/operators/functions'
import * as symbols from 'src/private/symbols'

declare global {
    // Update
    function Remove(): typeof symbols.remove
    function Overwrite<T>(value: T): {[symbols.overwrite]: T}
    function Increment(value: number): { [symbols.increment]: number }
    function Decrement(value: number): { [symbols.decrement]: number }
    function AddToSet<T>(...values: T[]): {[symbols.add]: Set<T>}
    function DeleteFromSet<T>(...values: T[]): {[symbols.Delete]: Set<T>}
    function AppendToArray<T>(...values: T[]): {[symbols.append]: T[]}
    function PrependToArray<T>(...values: T[]): {[symbols.prepend]: T[]}
    // Query/Condition
    function BeginsWith(value: string): {[symbols.beginsWith]: string}
    function Between<T extends string | number>(start: T, end: T): {[symbols.between]: [T,T]}
    function Equal<T>(value: T): {[symbols.equal]: T}
    function NotEqual<T>(value: T): {[symbols.notEqual]: T}
    function Greater<T extends string | number>(value: T): {[symbols.greater]: T}
    function GreaterEqual<T extends string | number>(value: T): {[symbols.greaterEqual]: T}
    function Lesser<T extends string | number>(value: T): {[symbols.lesser]: T}
    function LesserEqual<T extends string | number>(value: T): {[symbols.lesserEqual]: T}
    // Condition
    function AttributeExists(value: boolean): {[symbols.attributeExists]: boolean}
    function AttributeType(value: AttributeTypes): {[symbols.attributeType]: AttributeTypes}
    function Contains<T>(...values: T[]): {[symbols.contains]: T[]}
    function In<T>(...values: T[]): {[symbols.into]: T[]}
    function Size(value: TSize): {[symbols.size]: TSize}
}

global.Overwrite = operators.Overwrite
global.Remove = operators.Remove
global.AddToSet = operators.Add
global.Increment = operators.Increment
global.Decrement = operators.Decrement
global.DeleteFromSet = operators.Delete
global.AppendToArray = operators.Append
global.PrependToArray = operators.Prepend
global.BeginsWith = operators.BeginsWith
global.Between = operators.Between
global.Equal = operators.Equal
global.NotEqual = operators.NotEqual
global.Greater = operators.Greater
global.Lesser = operators.Lesser
global.GreaterEqual = operators.GreaterEqual
global.LesserEqual = operators.LesserEqual
global.AttributeExists = operators.AttributeExists
global.AttributeType = operators.AttributeType
global.Contains = operators.Contains
global.In = operators.In
global.Size = operators.Size

