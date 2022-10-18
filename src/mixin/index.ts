import { KeySchemaElement } from '@aws-sdk/client-dynamodb'
import { Initialize, Drop, Put, BatchPut, Delete, BatchDelete, Scan, Update, Save, Query, Get, BatchGet } from 'src/commands'
import { extractKeys, excludeKeys, proxy } from './functions'
import { validateType, validatePrimaryKey } from 'src/validation'
import { mainPM } from 'src/private'
import { Query as TQuery, PrimaryKeys, Condition, TableConfig, OmitMethods, Update as TUpdate, Class } from 'src/types'
import * as symbol from 'src/private/symbols'

export function dynam0RXMixin<T extends Class>(superclass: T) {
    return class Dynam0RX extends superclass {
        constructor(...args: any[]) {
            super()
            Object.defineProperty(Dynam0RX, 'name', { value: superclass.name })
            return proxy(this)
        }
        public static make <T> (this: new (...args: any) => T, init: OmitMethods<T>) {
            const instance = new this()
            for (const [key, value] of Object.entries(init)) {
                Object.defineProperty(instance, key, {
                    value: validateType(key, value),
                    enumerable: true,
                    writable: true,
                    configurable: true
                })
            }
            return instance
        }
        public static primaryKey <T extends Dynam0RX> (this: new (...args: any) => T, keys: PrimaryKeys<T>) {
            const px = proxy<TUpdate<T>>({})
            keys = validatePrimaryKey(superclass, keys)
            return {
                set attributes(x) {
                    throw Error('cannot assign to [attributes] property because it is an internal prop.')
                },
                get attributes() {
                    return px
                },
                get() {
                    return new Get<T>(superclass, keys).exec()
                },
                update(condition?: Condition<T>) {
                    return new Update<T>(superclass, keys, this.attributes, condition).exec()
                },
                delete(condition?: Condition<T>) {
                    return new Delete<T>(superclass, keys, condition).exec()
                }
            }
        }
        public static secondaryIndex<T>(this: new (...args: any) => T, index: any) {
            return {
                scan(Limit?: number) {
                    return new Scan<T>(superclass, { Limit, IndexName: index.name }).exec()
                },
                query(input: TQuery<T>, Limit?: number) {
                    return new Query<T>(superclass, input, { Limit, IndexName: index.name }).exec()
                }
            }
        }
        public static init(config?: TableConfig) {
            return new Initialize(superclass, config).exec()
        }
        public static drop() {
            return new Drop(superclass).exec()
        }
        public static scan<T>(this: new (...args: any) => T, Limit?: number) {
            return new Scan<T>(superclass, { Limit }).exec()
        }
        public static batchPut<T>(this: new (...args: any) => T, elements: T[]) {
            return new BatchPut<T>(superclass, elements).exec()
        }
        public static batchDelete<T>(this: new (...args: any) => T, keys: PrimaryKeys<T>[]) {
            return new BatchDelete<T>(superclass, keys).exec()
        }
        public static batchGet<T>(this: new (...args: any) => T, keys: PrimaryKeys<T>[]) {
            return new BatchGet<T>(superclass, keys).exec()
        }
        public static query<T>(this: new (...args: any) => T, input: TQuery<T>, Limit?: number) {
            return new Query<T>(superclass, input, { Limit }).exec()
        }
        public put() {
            return new Put<this>(superclass, this).exec()
        }
        public save() {
            return new Save<OmitMethods<this>>(superclass, extractKeys(superclass, this), excludeKeys(superclass, this)).exec()
        }
        public delete() {
            return new Delete<this>(superclass, extractKeys(superclass, this)).exec()
        }
    }
}