import {BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'

import {Dynam0RMTable} from 'src/table'
import {generateKeys} from 'src/table/functions'
import {TablesWM} from 'src/private'
import {tableName} from 'src/private/symbols'
import {Class, PrimaryKeys} from 'src/types'
import {validateKey} from 'src/validation'
import {workerSend} from 'src/commands/multithread/sender'

type RequestItem = {PutRequest: {Item: any}} | {DeleteRequest: {Key: any}}

export class BatchWrite {
    readonly #client: DynamoDBDocumentClient
    readonly #batchWritePool: BatchWriteCommandInput[] = []

    constructor(client: DynamoDBDocumentClient, private config: DynamoDBClientConfig) {
        this.#client = client
    }

    #addToPool(TableName: string, requestItem: RequestItem) {
        if (this.#batchWritePool.length) {
            for (let i = 0, batchWrite; i < this.#batchWritePool.length; i++) {
                batchWrite = this.#batchWritePool[i]
                if (batchWrite.RequestItems) {
                    let totalLength = 0
                    for (const [, RI] of Object.entries(batchWrite.RequestItems)) {
                        totalLength += RI.length
                    }
                    if (totalLength < 25) {
                        if (TableName in batchWrite.RequestItems) {
                            batchWrite.RequestItems[TableName].push(requestItem)
                            break
                        } else {
                            batchWrite.RequestItems[TableName] = [requestItem]
                            break
                        }
                    } else if (i === this.#batchWritePool.length - 1) {
                        this.#batchWritePool.push({RequestItems: {[TableName]: [requestItem]}})
                        break
                    }
                }
            }
        } else {
            this.#batchWritePool.push({RequestItems: {[TableName]: [requestItem]}})
        }
    }

    public selectTable<T extends Dynam0RMTable>(table: Class<T>) {
        const TableName = TablesWM(table).get(tableName)
        return {
            addPutRequest: (...elements: T[]) => {
                elements.forEach(Item => this.#addToPool(TableName, {PutRequest: {Item: {...Item}}}))
            },
            addDeleteRequest: (...keys: PrimaryKeys<T>) => {
                const generatedKeys = generateKeys(table, keys)
                generatedKeys.forEach(Key => {
                    if (validateKey(table, Key)) this.#addToPool(TableName, {DeleteRequest: {Key}})
                })
            }
        }
    }

    public async multiThreadWrite(Threads?: number){
        try {
            return {
                ok: true,
                output: await workerSend({
                    ClientConfig: this.config,
                    Commands: this.#batchWritePool.map(Input => ({Type: 'BatchWrite', Input})),
                    Threads
                })
            }
        }
        catch (error) {
            return {
                ok: false,
                error
            }
        }
    }

    public async write() {
        // TODO: Consider retry command if UnprocessedItems are returned
        try {
            return {
                ok: true,
                output: await Promise.all(this.#batchWritePool.map(command => {
                    return this.#client.send(new BatchWriteCommand(command))
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