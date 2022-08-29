import { propsToArray } from "../functions"

export function attributeNames(input: string[]|{[k:string]:any}) {
    let names = {}
    if (!(input instanceof Array)) {
        input = propsToArray(input)
    }
    for (const item of input as string[]) {
        names = { ...names, [`#${item}`]: item }
    }
    return names
}