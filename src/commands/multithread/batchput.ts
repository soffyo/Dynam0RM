import {isMainThread, parentPort} from 'node:worker_threads'
import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'
import {BatchWriteCommandOutput, DynamoDBDocumentClient, BatchWriteCommand} from '@aws-sdk/lib-dynamodb'

import {WorkerPool} from 'src/workers/pool'
import {Dynam0RMTable} from 'src/table'
import {TablesWM} from 'src/private'
import {tableName, config} from 'src/private/symbols'

import {JSObject, Class} from 'src/types'

interface Data {
    ClientConfig: DynamoDBClientConfig
    TableName: string
    Items: JSObject[]
}

let workerBatchPut: (target: Class<Dynam0RMTable>, Items: any[]) => Promise<BatchWriteCommandOutput | BatchWriteCommandOutput[]>

if (isMainThread) {
    workerBatchPut = async (target, Items) => {
        const pool = new WorkerPool<Data, BatchWriteCommandOutput>(__filename, 1)
        const data: Omit<Data, 'Items'> = {
            ClientConfig: TablesWM(target).get(config)!,
            TableName: TablesWM(target).get(tableName)!,
        }
        if (Items.length > 25) {
            const tasks: Promise<BatchWriteCommandOutput>[] = []
            for (let i = 0; i < Items.length; i += 25) {
                const chunk = Items.slice(i, i+25)
                tasks.push(new Promise((resolve, reject) => {
                    pool.runTask({...data, Items: chunk}, (error, result) => {
                        if (error) reject(error)
                        if (result) resolve(result)
                    })
                }))
            }
            const result = await Promise.all(tasks)
            await pool.close()
            return result
        } else {
            const result = await new Promise((resolve, reject) => {
                pool.runTask({...data, Items}, (error, result) => {
                    if (error) reject(error)
                    if (result) resolve(result)
                })
            }) as BatchWriteCommandOutput
            await pool.close()
            return result
        }
    }
} else {
    parentPort?.on('message', async (data: Data) => {
        const dynamodb = new DynamoDBClient(data.ClientConfig)
        const document = DynamoDBDocumentClient.from(dynamodb)

        const command = new BatchWriteCommand({
            RequestItems: {
                [data.TableName]: data.Items.map(Item => ({
                    PutRequest: {Item}
                }))
            }
        })

        const output = await document.send(command)

        parentPort?.postMessage(output)
    })
}

export {workerBatchPut}