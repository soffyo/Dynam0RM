import {BatchGetCommand, BatchGetCommandInput, DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {Dynam0RMTable} from 'src/table'
import {generateKeys} from 'src/table/functions'
import {TablesWM} from 'src/private'
import {tableName} from 'src/private/symbols'
import {validateKey} from 'src/validation'
import {Class, PrimaryKeys, JSObject} from 'src/types'

export class BatchGet {
    readonly #client: DynamoDBDocumentClient
    readonly #batchGetPool: BatchGetCommandInput[] = []

    public constructor(client: DynamoDBDocumentClient) {
        this.#client = client
    }

    #addToPool(TableName: string, Key: JSObject) {
        if (this.#batchGetPool.length) {
            for (let i = 0, batchGet; i < this.#batchGetPool.length; i++) {
                batchGet = this.#batchGetPool[i]
                if (batchGet.RequestItems) {
                    let totalLength = 0
                    for (const [,{Keys}] of Object.entries((batchGet.RequestItems))) {
                        totalLength += Keys?.length ?? 0
                    }
                    if (totalLength < 25) {
                        if (TableName in batchGet.RequestItems) {
                            batchGet.RequestItems[TableName].Keys?.push(Key)
                            break
                        } else {
                            batchGet.RequestItems[TableName] = {Keys: [Key]}
                            break
                        }
                    } else if (i === this.#batchGetPool.length - 1) {
                        this.#batchGetPool.push({
                            RequestItems: {
                                [TableName]: {Keys: [Key]}
                            }
                        })
                        break
                    }
                }
            }
        } else {
            this.#batchGetPool.push({
                RequestItems: {
                    [TableName]: {Keys: [Key]}
                }
            })
        }
    }

    public selectTable<T extends Dynam0RMTable>(table: Class<T>) {
        const TableName = TablesWM(table).get(tableName)
        return {
            addGetRequest: (...keys: PrimaryKeys<T>) => {
                generateKeys(table, keys).forEach(key => {
                    if (key && validateKey(table, key)) this.#addToPool(TableName, key)
                })
            }
        }
    }

    public async get() {
        try {
            return {
                ok: true,
                output: await Promise.all(this.#batchGetPool.map(command => {
                    return this.#client.send(new BatchGetCommand(command))
                }))
            }
        }
        catch (error) {
            return {
                ok: false,
                error
            }
        }
    }
}