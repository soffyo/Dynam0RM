import {CreateTable, Drop, Put, BatchPut, Delete, Scan, Save, Query, BatchGet} from 'src/commands'
import {PrimaryKeyObject, Condition, CreateTableConfig, Class, ValidRecord, QueryObject} from 'src/types'
import {extractKey, excludeKey, generateKeys, proxy} from './functions'
import {primaryKeyMethods, filterMethods} from './methods'
import {validateType, validateKey, Dynam0RMError} from 'src/validation'

export abstract class Dynam0RMTable {
    public constructor() {
        return proxy(this)
    }

    public static make<T extends Dynam0RMTable>(this: new (...args: any) => T, init: ValidRecord<T>) {
        const instance = new this()
        for (const [key, value] of Object.entries(init)) {
            if (validateType(value)) Object.defineProperty(instance, key, {
                value,
                enumerable: true,
                writable: true,
                configurable: true
            })
            else Dynam0RMError.invalidType(this, key)
        }
        return instance
    }

    public static keys<T extends Dynam0RMTable>(this: new (...args: any) => T, ...keys: T[] | [PrimaryKeyObject] | string[] | number[]) {
        let generatedKeys = generateKeys(this, keys).filter(k => {
            if (validateKey(this, k)) return true
            if (k) Dynam0RMError.invalidKey(this, k)
            return false
        })
        return {
            get: () => new BatchGet(this, generatedKeys).send(),
            ...primaryKeyMethods({constructor: this, keys: generatedKeys})
        }
    }

    public static query<T extends Dynam0RMTable>(this: new (...args: any) => T, hashValue: string | number, query?: QueryObject<string | number>) {
        return {
            scanForward: (Limit?: number) => new Query(this, hashValue, query, undefined, {ScanIndexForward: true, Limit}).send(),
            scanBackward: (Limit?: number) => new Query(this, hashValue, query, undefined, {ScanIndexForward: false, Limit}).send()
        }
    }

    public static async createTable<T extends Dynam0RMTable>(this: new (...args: any) => T, config?: CreateTableConfig) {
        return new CreateTable(this, config).send()
    }

    public static destroy<T extends Dynam0RMTable>(this: new (...args: any) => T) {
        return new Drop(this).send()
    }

    public static putItems<T extends Dynam0RMTable>(this: new (...args: any) => T, ...elements: T[]) {
        return new BatchPut(this, elements).send()
    }

    public static scan<T extends Dynam0RMTable>(this: new (...args: any) => T, Limit?: number) {
        return new Scan(this, undefined, {Limit}).send()
    }

    public static filter<T extends Dynam0RMTable>(this: new (...args: any) => T, filter: Condition<T>) {
        const conditions: Condition<T>[] = [filter]
        return filterMethods(this, conditions)
    }

    public save<T extends Dynam0RMTable>(this: T, {overwrite = true}: {overwrite?: boolean} = {}) {
        const constructor = this.constructor as Class<T>
        if (overwrite) return new Save(constructor, extractKey(constructor, this), excludeKey(constructor, this)).send()
        return new Put(constructor, this).send()
    }

    public delete<T extends Dynam0RMTable>(this: T) {
        const constructor = this.constructor as Class<T>
        return new Delete(constructor, extractKey(constructor, this)).send()
    }
}
