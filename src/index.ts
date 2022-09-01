import { PrimaryKeys, Condition, Response, Query, OmitMethods } from "./types"

interface PrimaryKeyMethods<T> {
    readonly attributes: OmitMethods<T>
    get(): Promise<T>
    delete(condition?: Condition<T>): Promise<Response<string>>
    update(condition?: Condition<T>): Promise<Response<string>>
}

export class Dynam0RX<T = {}> {
    constructor(initialize?: Partial<OmitMethods<T>>) {}
    static primaryKey<T extends Dynam0RX>(this: new (...args: any) => T, key: PrimaryKeys<T>): PrimaryKeyMethods<T> {
       return {} as PrimaryKeyMethods<T>
    }
    /**
     * @async **Initialize**
     * 
     * Creates the table on the DynamoDB database. 
     * The table configuration is provided via the `@Schema` decorator.
     * If no value for `{ tableName }` option is provided, the class identifier will be used for the table name
     * ```typescript
     * Schema()
     * class Sample extends Dynam0rx { someprop: string; someotherprop: number; } 
     * const init = await Sample.init() // TableName will be "Sample"
     * ```
     * @returns ```typescript
     * const init: { ok: boolean, response: string | Error["message"], error?: Error["name"] }
     * ```
     */
    static async init(): Promise<Response<string>> { 
        return {} as Response<string> 
    }
    /**
     * @async **Drop**
     * 
     * *Permanently* removes the corresponding table with all its content from the DynamoDB database.
     * @returns Response object: `{ ok: boolean, response: string | Error["message"], error?: Error["name"] }`
     */
    static async drop(): Promise<Response<string>> { 
        return {} as Response<string> 
    }
    /**
     * @async **BatchPut**
     * 
     * Puts multiple elements that are instances of the base class to the corresponding DynamoDB table. 
     * If one or more of the elements passed already exist in the table, they will be overwritten.
     * @param elements Array of instances.
     * @returns Response object: `{ ok: boolean, response: string | Error["message"], error?: Error["name"] }`
     */
    static async batchPut<T extends Dynam0RX>(this: new (...args: any) => T, elements: T[]): Promise<Response<string>> { 
        return {} as Response<string> 
    }
    /**
     * @async **BatchDelete**
     * 
     * Deletes multiple elements from the corresponding DynamoDB table in a single operation.
     * ```typescript
     * const deleteItems = await batchDelete([item1, item2])
     * ```
     * @param keys Array of keys or instances.
     * @returns ```typescript
     * const deleteItems: { ok: boolean, response: string, error?: Error["name"] }
     * ```
     */
    static async batchDelete<T extends Dynam0RX>(this: new (...args: any) => T, keys: PrimaryKeys<OmitMethods<T>>[]|T[]): Promise<Response<string>> { 
        return {} as Response<string> 
    } 
    /**
     * @async **BatchGet**
     * 
     * Retrieves multiple items from the corresponding DynamoDB table in a single operation.
     * @param keys Array of keys or instances.
     * @returns Array of retrieved instances.
     */
    static async batchGet<T extends Dynam0RX>(this: new (...args: any) => T, keys: PrimaryKeys<OmitMethods<T>>[]|T[]): Promise<T[]> { return [] as T[] }
    /**
     * @async **Scan**
     * 
     * Retrieves all the items from the correspondig DynamoDB table.
     * @param limit Limits the maximum amount of elements to retrieve.
     * @returns Array of instances
     */
    static async scan<T extends Dynam0RX>(this: new (...args: any) => T, limit?: number): Promise<T[]> { return [] as T[] }
    /**
     * **Query**
     * 
     * Performs a query operation on the secondary key (if the table has one). 
     * If the table has no sort key, only the partition key can be evaluated for equality
     * @param query A query object: `{ partitionKey: "something", sortkey: between(10, 20) }`
     * @param limit The maximum amount of items to retrieve
     * @returns Array of instances of the corresponding Item
     */
    static async query<T extends Dynam0RX>(this: new (...args: any) => T, query: Query<T>, limit?: number): Promise<T[]> { return [] as T[] }
    static async update<T extends Dynam0RX>(this: new (...args: any) => T, keys: PrimaryKeys<OmitMethods<T>>|T, { update, condition }: { update: Partial<OmitMethods<T>>, condition?: Condition<T>}): Promise<T> { return {} as T }
    /**
     * **Put**
     * 
     * Puts the current item to the corresponding DynamoDB table. 
     * The operation succedes only if an item with the same primary key doesn't already exist.
     * @returns Response object: `{ ok: boolean, response: string | Error["message"], error?: Error["name"] }`
     */
    async put<T extends Dynam0RX>(this: T): Promise<Response<string>> { return {} as Response<string> }
    /**
     * **Save**
     * 
     * Saves the current item to te corresponding DynamoDB table. 
     * If an item with the same primary key doesn't already exist, it is created. 
     * If, instead, an item with the same primary key exists, it is updated with the current item properties.
     * @returns Response object: `{ ok: boolean, response: string | Error["message"], error?: Error["name"] }`
     */
    async save<T extends Dynam0RX>(this: T): Promise<T> { return {} as T }
    /**
     * **Delete**
     * 
     * Deletes the item form the corresponding DynamoDB table. 
     * @param condition A condition object. Example: `{ prop1: equal(value1), prop2: contains("something") ... }`
     * @returns Response object: `{ ok: boolean, response: string | Error["message"], error?: Error["name"] }`
     */
    async delete<T extends Dynam0RX>(this: T): Promise<Response<string>> { return {} as Response<string> }
    /**
     * **Get**
     * Retrieved the current object from the corresponding DynamoDB table.
     * @returns The matched obejct
     */
    //async get<T extends Dynam0RX>(this: T): Promise<T> { return undefined as unknown as T }
    //async update<T extends Dynam0RX>(this: T, condition?: Condition<T>): Promise<Response<string>> { return {} as Response<string> }
}

export * from "./decorators"
export * as Dynam0RXDecorators from "./decorators"