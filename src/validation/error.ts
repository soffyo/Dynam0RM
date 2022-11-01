import {Class, JSObject} from "src/types"
import {TablesWM} from "src/private";
import * as symbols from "src/private/symbols";
import {Dynam0RMTable} from "src/table";

type Caller = Function | {name: string}

export class Dynam0RMError extends Error {
    constructor(message?: string) {
        super(message)
        super.name = 'Dynam0RMError'
    }

    public static invalidType<T extends Dynam0RMTable>(constructor: Class<T>, key: string | symbol) {
        const error = {
            message: `Unsupported type assigned to property [${String(key)}]. You may only use DynamoDB supported types.`,
            name: 'InvalidType'
        }
        this.log(constructor, {name: `${constructor.name} property assignment`}, error)
    }

    public static invalidDecorator<T extends Dynam0RMTable>(constructor: Class<T>, decoratorName: string, message?: string) {
        const error = {
            message: message ?? `Decorator @${decoratorName} used on unsupported class or property.`,
            name: 'InvalidDecorator'
        }
        this.log(constructor, {name: decoratorName}, error)
    }

    public static invalidKey<T extends Dynam0RMTable>(constructor: Class<T>, key: JSObject, message?: string) {
        const error = {
            message: message ?? `Key ${JSON.stringify(key).replace(/"/g, '').replace(/:/g, ': ')} is not a valid Primary Key.`,
            name: 'InvalidKey'
        }
        this.log(constructor, {name: `${constructor.name}.keys`}, error)
    }

    public static log<T extends Dynam0RMTable>(target: Class<T>, caller: Function | {name: string}, error: Error) {
        const className = target.name
        console.warn(`Dynam0RM: [Class: ${className}; Function: ${caller.name}] -> ${error.name} -> ${error.message}`)
    }
}