import 'reflect-metadata'
import { Class } from 'src/types'
import { Dynam0RXError} from "src/validation/error";

export function validateKeyDecorator <T extends Class> (target: T, key: string): object {
    const type = Reflect.getMetadata('design:type', target.prototype, key)
    if (type !== String && type !== Number) {
        throw new Dynam0RXError(`Primary and Index key decorators can only be applied on String or Number attributes but attribute [${key}] has type '${type?.name}'.`)
    }
    return type
}

export function validateTTLDecorator(target: Class, key: string) {
    const type = Reflect.getMetadata('design:type', target.prototype, key)
    if (type !== Number) {
        throw new Dynam0RXError(`TimeToLive attributes can only be applied on Number attributes but attribute [${key}] has type '${type?.name}'.`)
    }
    return type
}