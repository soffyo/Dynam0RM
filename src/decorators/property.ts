import "reflect-metadata"

function addTypedKey<T extends { new (...args: any[]): {} }>(key: "_dynam0rx_partitionKey"|"_dynam0rx_sortKey", prototype: InstanceType<T>, name: string) {
    const type = (Reflect.getMetadata("design:type", prototype, name).name).toLowerCase()
    if (type !== "string" && type !== "number") {
        throw TypeError(`Partition key can only be of type "string" or "number" but "${type}" type has been found.`)
    }
    Object.defineProperty(prototype.constructor, key, {
        value: { type, name }
    })
}

export function partitionKey<T extends { new (...args: any[]): {} }>(prototype: InstanceType<T>, key: string) {
    addTypedKey("_dynam0rx_partitionKey", prototype, key)
}

export function sortKey<T extends { new (...args: any[]): {} }>(prototype: InstanceType<T>, key: string) {
    addTypedKey("_dynam0rx_sortKey", prototype, key)
}