import { mainPM } from "src/private"
import { validateTTLDecorator } from "src/validation";
import { Dynam0RXError } from "src/validation/error";
import * as symbols from 'src/private/symbols'

export function TimeToLive(prototype: any, key: string) {
    const PM = mainPM(prototype.constructor)
    validateTTLDecorator(prototype.constructor, key)
    if (PM.has(symbols.ttl)) {
        throw new Dynam0RXError(`Multiple TimeToLive decorators found on [${prototype.constructor.name}]. Only one TimeToLive attribute is allowed.`)
    } else {
        mainPM(prototype.constructor).set(symbols.ttl, key)
    }
}