import { CreateTable, Drop, Put, BatchPut, Delete, BatchDelete, Scan, Update, Save, Query, Get, BatchGet } from 'src/commands'
import { Query as TQuery, PrimaryKeys, Condition, CreateTableConfig, OmitMethods, Update as TUpdate, Class, ValidRecord, AllowedScalar } from 'src/types'
import { extractKeys, excludeKeys, proxy } from './functions'
import { validateType, validatePrimaryKey } from 'src/validation'

export function dynam0RXMixin<T extends Class>(superclass: T) {
    return class Dynam0RX extends superclass {
        constructor(...args: any[]) {
            super()
            Object.defineProperty(Dynam0RX, 'name', { value: superclass.name })
            return proxy(this)
        }
        public static make <T> (this: new (...args: any) => T, init: ValidRecord<T>) {
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
            keys = validatePrimaryKey(superclass, keys)
            return {
                get() {
                    return new Get<T>(superclass, keys).exec()
                },
                update(attributes: TUpdate<T>) {
                    return {
                        if(condition: Condition<T>) {
                            return new Update<T>(superclass, keys, attributes, condition).exec()
                        },
                        now() {
                            return new Update<T>(superclass, keys, attributes).exec()
                        }
                    }
                },
                delete: {
                    if(condition: Condition<T>) {
                        return new Delete<T>(superclass, keys, condition).exec()
                    },
                    now() {
                        return new Delete<T>(superclass, keys).exec()
                    }
                }
            }
        }
        public static secondaryIndex<T>(this: new (...args: any) => T, IndexName: string) {
            return {
                scan({Limit}: { Limit?: number } = {}) {
                    return {
                        filter(filterInput: Condition<T>) {
                            return new Scan<T>(superclass, { Limit, IndexName }, filterInput).exec()
                        },
                        all() {
                            return new Scan<T>(superclass, { Limit, IndexName }).exec()
                        }
                    }
                },
                query(input: TQuery<T>) {
                    const methods = (Filter: boolean = false) => ({
                        scanforward({ Limit }: { Limit?: number } = {}) {
                            return new Query<T>(superclass, input, { Limit, Filter, ScanIndexForward: true, IndexName }).exec()
                        },
                        scanbackward({ Limit }: { Limit?: number } = {}) {
                            return new Query<T>(superclass, input, { Limit, Filter, ScanIndexForward: false, IndexName }).exec()
                        }
                    })
                    return {
                        ...methods(),
                        filter(filterInput: Condition<T>) {
                            input = { ...input, ...filterInput }
                            return { ...methods(true) }
                        }
                    }
                }
            }
        }
        public static createTable(config?: CreateTableConfig) {
            return new CreateTable(superclass, config).exec()
        }
        public static destroy() {
            return new Drop(superclass).exec()
        }
        public static batchPut<T>(this: new (...args: any) => T, elements: T[]) {
            return new BatchPut<T>(superclass, elements).exec()
        }
        public static batchDelete<T>(this: new (...args: any) => T, keys: PrimaryKeys<T>[]) {
            keys = keys.map(keys => validatePrimaryKey(superclass, keys))
            return new BatchDelete<T>(superclass, keys).exec()
        }
        public static batchGet<T>(this: new (...args: any) => T, keys: PrimaryKeys<T>[]) {
            keys = keys.map(keys => validatePrimaryKey(superclass, keys))
            return new BatchGet<T>(superclass, keys).exec()
        }
        public static scan<T>(this: new (...args: any) => T, {Limit}: { Limit?: number } = {}) {
            return {
                filter(filterInput: Condition<T>) {
                    return new Scan<T>(superclass, { Limit }, filterInput).exec()
                },
                all() {
                    return new Scan<T>(superclass, { Limit }).exec()
                }
            }
        }
        public static query<T>(this: new (...args: any) => T, input: TQuery<T>) {
            const methods = (Filter: boolean = false) => ({
                scanforward({ Limit }: { Limit?: number } = {}) {
                    return new Query<T>(superclass, input, { Limit, Filter, ScanIndexForward: true }).exec()
                },
                scanbackward({ Limit }: { Limit?: number } = {}) {
                    return new Query<T>(superclass, input, { Limit, Filter, ScanIndexForward: false }).exec()
                }
            })
            return {
                ...methods(),
                filter(filterInput: Condition<T>) {
                    input = { ...input, ...filterInput }
                    return { ...methods(true) }
                }
            }
        }
        public put() {
            return new Put<OmitMethods<this>>(superclass, this).exec()
        }
        public save() {
            return new Save<OmitMethods<this>>(superclass, extractKeys(superclass, this), excludeKeys(superclass, this)).exec()
        }
        public delete() {
            return new Delete<OmitMethods<this>>(superclass, extractKeys(superclass, this)).exec()
        }
    }
}