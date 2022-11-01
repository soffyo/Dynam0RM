import {TransactWriteCommand, TransactWriteCommandInput, DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'
import {Class, Condition, PrimaryKeys, Update as TUpdate} from 'src/types'
import {Put, Delete, Update} from 'src/commands'
import {Dynam0RMTable} from 'src/table'
import {generateKeys} from 'src/table/functions'

export class Transaction {
    readonly #transaction: TransactWriteCommandInput = {TransactItems: []}
    readonly #client: DynamoDBDocumentClient

    public constructor(client: DynamoDBDocumentClient) {
        this.#client = client
    }

    #addPut<T extends Dynam0RMTable>(constructor: Class<T>, items: T[]) {
        items.forEach(Item => this.#transaction.TransactItems?.push({Put: new Put(constructor, Item).commandInput()}))
    }

    #addDelete<T extends Dynam0RMTable>(constructor: Class<T>, keys: PrimaryKeys<T>, conditions?: Condition<T>[]) {
        const generatedKeys = generateKeys(constructor, keys)
        generatedKeys.forEach(Key => this.#transaction.TransactItems?.push({Delete: new Delete(constructor, Key, conditions).commandInput()}))
    }

    #addUpdate<T extends Dynam0RMTable>(constructor: Class<T>, keys: PrimaryKeys<T>, update: TUpdate<T>, conditions?: Condition<T>[]) {
        const generatedKeys = generateKeys(constructor, keys)
        generatedKeys.forEach(key =>
            new Update(constructor, key, update, conditions).commandInput().forEach(i =>
                this.#transaction.TransactItems?.push({Update: i as Required<typeof i>})))
    }

    public table<T extends Dynam0RMTable>(table: Class<T>) {
        return {
            put: (...items: T[]) => this.#addPut(table, items),
            keys: (...keys: PrimaryKeys<T>) => {
                const conditions: Condition<T>[] = []
                const commands = {
                    delete: () => this.#addDelete(table, keys, conditions),
                    update: (update: TUpdate<T>) => this.#addUpdate(table, keys, update, conditions)
                }
                const or = (condition: Condition<T>) => {
                    conditions.push(condition)
                    return {or, ...commands}
                }
                return {
                    ...commands,
                    if(condition: Condition<T>) {
                        conditions.push(condition)
                        return {or, ...commands}
                    }
                }
            }
        }
    }

    public async executeTransaction() {
        try {
            return {
                ok: true,
                output: await this.#client.send(new TransactWriteCommand(this.#transaction))
            }
        } catch (error) {
            return {
                ok: false,
                error
            }
        }
    }
}