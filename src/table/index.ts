import {CreateTable, DeleteTable, Put, DescribeTable, BatchPutMono, Delete, Scan, Save, Query, BatchGetMono, Update, BatchDeleteMono} from 'src/commands'
import {Condition, CreateTableConfig, Class, ValidRecord, QueryObject, PrimaryKeys, Update as TUpdate} from 'src/types'
import {extractKey, excludeKey, generateKeys, proxy} from './functions'
import {validateType, validateKey, Dynam0RMError} from 'src/validation'
import {workerBatchPut} from 'src/commands/multithread/batchput'
import {workerPut} from 'src/commands/multithread/put'

export abstract class Dynam0RMTable {
    public constructor() {
        return proxy(this)
    }

    public static make<T extends Dynam0RMTable>(this: new (...args: any) => T, attributes: ValidRecord<T>) {
        const instance = new this()

        for (const [key, value] of Object.entries(attributes)) {
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

    public static create<T extends Dynam0RMTable>(this: new (...args: any) => T, config?: CreateTableConfig) {
        return new CreateTable(this, config).send()
    }

    public static delete<T extends Dynam0RMTable>(this: new (...args: any) => T) {
        return new DeleteTable(this).send()
    }

    public static describe<T extends Dynam0RMTable>(this: new (...args: any) => T) {
        return new DescribeTable(this).send()
    }

    public static sync<T extends Dynam0RMTable>(this: new (...args: any) => T) {
        // TODO
    }

    public static scan<T extends Dynam0RMTable>(this: new (...args: any) => T, Limit?: number) {
        return new Scan(this, undefined, {Limit}).send()
    }

    public static query<T extends Dynam0RMTable>(this: new (...args: any) => T, hashValue: string | number, query?: QueryObject<string | number>) {
        return {
            scanForward: (Limit?: number) => new Query(this, hashValue, query, undefined, {ScanIndexForward: true, Limit}).send(),
            scanBackward: (Limit?: number) => new Query(this, hashValue, query, undefined, {ScanIndexForward: false, Limit}).send()
        }
    }

    public static filterResults<T extends Dynam0RMTable>(this: new (...args: any) => T, filter: Condition<T>) {
        const conditions = [filter]
        const exec = {
            query: (hashValue: string | number, query?: QueryObject<string | number>) => ({
                scanForward: (Limit?: number) => new Query(this, hashValue, query, conditions, {ScanIndexForward: true, Limit}).send(),
                scanBackward: (Limit?: number) => new Query(this, hashValue, query, conditions, {ScanIndexForward: false, Limit}).send()
            }),
            scan: (Limit?: number) => new Scan<T>(this, conditions, {Limit}).send(),
        }
        const or = (condition: Condition<T>) => {
            conditions.push(condition)
            return {or, ...exec}
        }
        return {or, ...exec}
    }

    public static put<T extends Dynam0RMTable>(this: new (...args: any) => T, ...elements: T[]) {
        return Promise.all(elements.map(e => new Put(this, e).send()))
    }

    public static batchPut<T extends Dynam0RMTable>(this: new (...args: any) => T, ...elements: T[]) {
        return new BatchPutMono(this, elements).send()
    }

    public static select<T extends Dynam0RMTable>(this: new (...args: any) => T, ...keys: PrimaryKeys<T>) {
        const generatedKeys = generateKeys(this, keys).filter(k => {
            if (validateKey(this, k)) return true
            if (k) Dynam0RMError.invalidKey(this, k)
            return false
        })
        const conditions: Condition<T>[] = []
        const methods = {
            update: (update: TUpdate<T>) => Promise.all(generatedKeys.map(key =>
                new Update(this, key, update, conditions).send())),
            delete: () => Promise.all(generatedKeys.map(key => new Delete(this, key, conditions).send()))
        }
        const or = (condition: Condition<T>) => {
            conditions.push(condition)
            return {or, ...methods}
        }
        return {
            get: () => new BatchGetMono(this, generatedKeys).send(),
            batchDelete: () => new BatchDeleteMono(this, generatedKeys).send(),
            if(condition: Condition<T>) {
                conditions.push(condition)
                return {or, ...methods}
            },
            ...methods,
        }
    }

    public static multiThreadedBatchPut<T extends Dynam0RMTable>(this: new (...args: any) => T, ...elements: T[]) {
        return workerBatchPut(this, elements.map(e => ({...e})))
    }

    public static multiThreadedPut<T extends Dynam0RMTable>(this: new (...args: any) => T, ...elements: T[]) {
        return workerPut(this, elements.map(e => ({...e})))
    }

    public save<T extends Dynam0RMTable>(this: T, {overwrite = true}: { overwrite?: boolean } = {}) {
        const constructor = this.constructor as Class<T>
        if (overwrite) return new Save(constructor, extractKey(constructor, this), excludeKey(constructor, this)).send()
        return new Put(constructor, this).send()
    }

    public delete<T extends Dynam0RMTable>(this: T) {
        const constructor = this.constructor as Class<T>
        return new Delete(constructor, extractKey(constructor, this)).send()
    }
}
