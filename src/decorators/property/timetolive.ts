import {TablesWM} from 'src/private'
import {Dynam0RMError} from 'src/validation'
import {getType} from './functions'
import * as symbols from 'src/private/symbols'

export function TimeToLive(prototype: any, key: string) {
    const WM = TablesWM(prototype.constructor)
    const type = getType(prototype, key)
    if (type === Number && !WM.has(symbols.ttl)) {
        TablesWM(prototype.constructor).set(symbols.ttl, key)
    } else {
        let message
        if (type !== Number) {
            message = `@TimeToLive decorator used on non compatible property [${key}]. Only one property of type Number may be used.`
        } else if (WM.has(symbols.ttl)) {
            message = `Multiple @TimeToLive decorators found on [${prototype.constructor.name}]. `+
            `Only one TTL attribute is allowed.`
        }
        Dynam0RMError.invalidDecorator(prototype.constructor, 'TimeToLive', message)
    }
}