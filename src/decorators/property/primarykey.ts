import "reflect-metadata"
import { KeySchemaElement } from "@aws-sdk/client-dynamodb"
import { addToArraySymbol, addToObjectSymbol, validateType, attributeDefinition } from "./functions"
import * as symbol from "../../definitions/symbols"

function addAttribute(prototype: any, key: string, keySchemaElement: KeySchemaElement, name: string|symbol) {
    const type = validateType(Reflect.getMetadata("design:type", prototype, key))
    addToArraySymbol(prototype.constructor, symbol.keySchema, keySchemaElement)
    addToArraySymbol(prototype.constructor, symbol.attributeDefinitions, attributeDefinition(key, type))
    addToObjectSymbol(prototype.constructor, symbol.primaryKeys, [name, key])
}

export function partitionKey(prototype: any, key: string) {
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: "HASH"
    }
    addAttribute(prototype, key, keySchemaElement, symbol.partitionKey)
}

export function sortKey(prototype: any, key: string) {
    const keySchemaElement: KeySchemaElement = {
        AttributeName: key,
        KeyType: "RANGE"
    }
    addAttribute(prototype, key, keySchemaElement, symbol.sortKey)
}