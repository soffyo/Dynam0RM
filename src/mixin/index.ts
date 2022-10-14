import { KeySchemaElement } from '@aws-sdk/client-dynamodb'
import { Initialize, Drop, Put, BatchPut, Delete, BatchDelete, Scan, Update, Save, Query, Get, BatchGet } from 'src/commands'
import { extractKeys, excludeKeys, proxy } from './functions'
import { validateType } from 'src/validation'
import { mainPM } from 'src/private'
import { Query as TQuery, PrimaryKeys, Condition, TableConfig, OmitMethods } from 'src/types'
import * as symbol from 'src/definitions/symbols'

export function dynam0RXMixin<T extends { new (...args: any[]): {} }>(superclass: T) { 
    abstract class Dynam0RX extends superclass {
        readonly #proxy = proxy(this)
        private constructor(...args: any[]) {
            super()
            if (args.length > 1) {
                throw TypeError('Only one argument allowed')
            }
            if (args[0]){
                for (const [key,value] of Object.entries(args[0])) {
                    Object.defineProperty(this.#proxy, key, {
                        value: validateType(key, value as any), 
                        enumerable: true, 
                        writable: true,
                        configurable: true
                    })
                }
            }
            Object.defineProperty(Dynam0RX, 'name', { value: superclass.name })
            return this.#proxy
        }
        public static primaryKey<T>(this: new (...args: any) => T, keys: PrimaryKeys<T>) {
            const pk = mainPM(superclass).get<KeySchemaElement[]>(symbol.keySchema)[0]?.AttributeName
            const sk = mainPM(superclass).get<KeySchemaElement[]>(symbol.keySchema)[1]?.AttributeName
            const tn = mainPM(superclass).get<string>(symbol.tableName)
            for (const k in keys) {
                if (k !== pk && k !==  sk) {
                    throw Error(`
                        Key "${k}" have been used as primary key but table "${tn}"'s KeySchema
                        has been setup with partition key: "${pk}"${sk && ', sort key: "' + sk+'"'}.
                    `)
                }
            }
            return new class {
                #proxy = proxy({})
                private set attributes(x) {
                    throw Error('cannot assign to "attributes" property because it is an internal prop.')
                }
                public get attributes() {
                    return this.#proxy
                }
                public async get() {
                    return new Get<T>(superclass, keys).exec()
                }
                public async update(condition?: Condition<T>) {
                    return new Update<T>(superclass, keys, this.attributes, condition).exec()
                }
                public async delete(condition?: Condition<T>) {
                    return new Delete<T>(superclass, keys, condition).exec()
                }
            }
        }
        public static secondaryIndex<T>(this: new (...args: any) => T, index: any) {
            return {
                async scan(Limit?: number) {
                    return new Scan<T>({ Limit, IndexName: index.name }).exec() 
                },
                async query(input: TQuery<T>, Limit?: number) {
                    return new Query<T>(superclass, input, { Limit, IndexName: index.name }).exec()
                }
            }
        }
        static async init(config?: TableConfig) {
            return new Initialize(superclass, config).exec()
        }
        static async drop() {
            return new Drop(superclass).exec()
        }
        static async scan<T>(this: new (...args: any) => T, Limit?: number) {
            return new Scan<T>(superclass, { Limit }).exec()
        }
        static async batchPut<T>(this: new (...args: any) => T, elements: T[]) {
            return new BatchPut<T>(superclass, elements).exec()
        }
        static async batchDelete<T>(this: new (...args: any) => T, key: PrimaryKeys<T>[]) {
            const primaryKeys = key.map((item: any) => extractKeys(superclass, item))
            return new BatchDelete<T>(superclass, primaryKeys).exec()
        }
        static async batchGet<T>(this: new (...args: any) => T, keys: PrimaryKeys<T>[]) {
            return new BatchGet<T>(superclass, keys).exec()
        }
        static async query<T>(this: new (...args: any) => T, input: TQuery<T>, Limit?: number) {
            return new Query<T>(superclass, input, { Limit }).exec()
        }
        async put() {
            return new Put<this>(superclass, this).exec()
        }
        async save() {
            return new Save<this>(superclass, extractKeys(superclass, this), excludeKeys(superclass, this)).exec()
        }
        async delete() {
            return new Delete<this>(superclass, extractKeys(superclass, this)).exec()
        }
    }
    return Dynam0RX
}

export const Dynam0RX = dynam0RXMixin(class {
    static make <T> (this: new (...args: any) => T, init: OmitMethods<T>) {
        return new this(init)
    }
})