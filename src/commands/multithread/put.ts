import {isMainThread, parentPort} from 'node:worker_threads'
import {DynamoDBDocumentClient, PutCommand, PutCommandOutput} from '@aws-sdk/lib-dynamodb'
import {DynamoDBClient, KeySchemaElement} from '@aws-sdk/client-dynamodb'

import {WorkerPool} from 'src/workers/pool'
import {TablesWM} from 'src/private'
import {config, tableName, keySchema, ignore} from 'src/private/symbols'

import {Class, DBData} from 'src/types'
import {Dynam0RMTable} from 'src/table'
import {attributeNames} from 'src/generators'


interface PutData extends DBData {
    KeySchema: KeySchemaElement[]
    Ignore: string[]
    Item?: Dynam0RMTable
}

let workerPut: (target: Class<Dynam0RMTable>, Items: Dynam0RMTable[]) => Promise<PutCommandOutput[]>

if (isMainThread) {
    workerPut = async (target: Class<Dynam0RMTable>, Items: Dynam0RMTable[]) => {
        const pool = new WorkerPool<PutData, PutCommandOutput>(__filename, 1)
        const data: PutData = {
            ClientConfig: TablesWM(target).get(config)!,
            TableName: TablesWM(target).get(tableName)!,
            KeySchema: TablesWM(target).get(keySchema)!,
            Ignore: TablesWM(target).get(ignore)!
        }
        const tasks: Promise<PutCommandOutput>[] = []
        for (const Item of Items) {
            tasks.push(new Promise<PutCommandOutput>((resolve, reject) => {
                pool.runTask({...data, Item}, (error, result) => {
                   if (error) reject(error)
                   if (result) resolve(result)
                })
            }))
        }

        const output = await Promise.all(tasks)
        pool.close()
        return output
    }
} else {
    parentPort?.on('message', async (data: PutData) => {
        const dynamodb = new DynamoDBClient(data.ClientConfig)
        const document = DynamoDBDocumentClient.from(dynamodb)

        const PK = data.KeySchema[0]?.AttributeName
        const SK = data.KeySchema[1]?.AttributeName
        let ConditionExpression = `attribute_not_exists (#${PK})`
        if (SK) ConditionExpression += ` AND attribute_not_exists (#${SK})`
        if (data.Ignore?.length) for (const key in data.Item) {
            if (data.Ignore.includes(key)) delete data.Item[key as keyof typeof data.Item]
        }

        const command = new PutCommand({
            TableName: data.TableName,
            ExpressionAttributeNames: attributeNames([PK, SK]),
            ConditionExpression,
            Item: data.Item,
            ReturnConsumedCapacity: 'INDEXES'
        })

        const output = await document.send(command)

        parentPort?.postMessage(output)
    })
}

export {workerPut}
