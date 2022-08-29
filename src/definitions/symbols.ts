// Query operators
    export const equal = Symbol.for("=")
    export const notEqual = Symbol.for("<>")
    export const lesser = Symbol.for("<")
    export const lesserEqual = Symbol.for("<=")
    export const greater = Symbol.for(">")
    export const greaterEqual = Symbol.for(">=")
    export const between = Symbol.for("between")
    export const beginsWith = Symbol.for("begins_with")

    export const querySymbols = [
        equal,
        notEqual,
        lesser,
        lesserEqual,
        greater,
        greaterEqual,
        between,
        beginsWith
    ]

    export type QuerySymbols = typeof equal | typeof notEqual | typeof lesser 
    | typeof lesserEqual | typeof greater | typeof greaterEqual | typeof between | typeof beginsWith

// Condition operators
    export const contains = Symbol.for("contains")
    export const into = Symbol.for("in")
    export const size = Symbol.for("size")
    export const attributeExists = Symbol.for("attribute_exists")
    export const attributeType = Symbol.for("attribute_type")

    export const conditionSymbols = [
        contains,
        into,
        size,
        attributeExists,
        attributeType
    ]

    export type ConditionSymbols = typeof contains | typeof into | typeof size
    | typeof attributeExists | typeof attributeType

// Update operators
    export const add = Symbol.for("add")
    export const delet3 = Symbol.for("delete")
    export const append = Symbol.for("append")
    export const prepend = Symbol.for("prepend")
    export const remove = Symbol.for("remove")
    export const increment = Symbol.for("increment")
    export const decrement = Symbol.for("decrement")

    export const updateSymbols = [
        add, 
        delet3,
        append,
        increment,
        decrement
    ]

    export type UpdateSymbols = typeof add | typeof delet3 | typeof append | typeof remove

    export const symbols = [...querySymbols, ...conditionSymbols, ...updateSymbols]