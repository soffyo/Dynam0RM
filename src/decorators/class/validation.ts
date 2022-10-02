import { Blob } from "buffer"
import { isObject } from "../../functions"

export function validate<T>(target: T) {
    let ok: boolean = false
    void (function recursiveValidation(value = target): boolean {
        switch (typeof value) {
            case "string": ok = true
            case "number": ok = true
            case "bigint": ok = true
            case "boolean": ok = true
            case "object": 
                if (value instanceof Array) {
                    for (const item of value) {
                        recursiveValidation(item)
                    }
                }
                if (value instanceof Uint8Array || value instanceof Buffer || value instanceof Blob) {
                    ok = true
                }
                if (value instanceof Set) {
                    let strings = false
                    let numbers = false
                    let binary = false
                    for (const item of value) {
                        if (typeof item === "string") {
                            strings = true
                        }
                        if (typeof item === "number" || typeof item === "bigint") {
                            numbers = true
                        }
                        if (item instanceof Uint8Array || value instanceof Buffer || value instanceof Blob) {
                            binary = true
                        }
                    }
                    if ((strings && !numbers && !binary) ||
                        (numbers && !strings && !binary) ||
                        (binary && !strings && !numbers)) {
                        ok = true
                    }
                }
                if (isObject(value)) {
                    for (const [k,v] of Object.entries(value)) {
                        if (typeof k === "symbol") {
                            return
                        } else if (typeof k === "string") {
                            recursiveValidation(v)
                        }
                    }
                    if (Object.keys(value).length === 0) { 
                        if (value instanceof Map) {
                            return
                        }
                        ok = true
                    }
                }
                if (value === null) {
                    ok = true
                }
                break
            default: return ok = false
        }
    })()
    if (ok === false) {
        console.log(Error(`You assigned a type that is not supported by DynamoDB`))
        throw Error(`You assigned a type that is not supported by DynamoDB`)
    }
    return target
}