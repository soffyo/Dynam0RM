import 'reflect-metadata'
import { Class } from 'src/types'

export function validateKeyDecorator <T extends Class> (target: T, key: string): Object {
    const type = Reflect.getMetadata('design:type', target.prototype, key)
    if (type !== String && type !== Number) {
        throw TypeError(`Primary and Index key decorators can only be applied on String or Number attributes but attribute [${key}] have type '${type?.name}'.`)
    }
    return type
}