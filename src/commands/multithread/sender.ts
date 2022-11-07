import {isMainThread, parentPort} from 'node:worker_threads'
import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'

import {
    BatchGetCommand,
    BatchWriteCommand,
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ServiceOutputTypes,
    UpdateCommand
} from '@aws-sdk/lib-dynamodb'

import {WorkerPool} from 'src/workers/pool'

interface Data {
    ClientConfig: DynamoDBClientConfig
    Commands: {
        Input: any
        Type: string
    }[]
    Threads?: number
}

interface WorkerData {
    ClientConfig: DynamoDBClientConfig
    Command: {
        Input: any
        Type: string
    }
}

let workerSend: (data: Data) => Promise<any>

if (isMainThread) {
    workerSend = async (data) => {
        const pool = new WorkerPool<WorkerData, ServiceOutputTypes>(__filename, data.Threads)
        const output: any[] = []
        for (const Command of data.Commands) {
            output.push(new Promise((resolve, reject) => {
                pool.runTask({ClientConfig: data.ClientConfig, Command}, (error, result) => {
                    if (error) reject(error)
                    if (data) resolve(result)
                })
            }))
        }
        const o = await Promise.all(output)
        pool.close()
        return o
    }
} else {
    parentPort?.on('message', async (data: WorkerData) => {
        const dynamodb = new DynamoDBClient(data.ClientConfig)
        const document = DynamoDBDocumentClient.from(dynamodb)

        let command: any

        switch (data.Command.Type) {
            case 'Put': command = PutCommand
                break
            case 'Delete': command = DeleteCommand
                break
            case 'Update': command = UpdateCommand
                break
            case 'Get': command = GetCommand
                break
            case 'BatchWrite': command = BatchWriteCommand
                break
            case 'BatchGet' : command = BatchGetCommand
                break
        }

        if (command) {
            const output = await document.send(new command(data.Command.Input))
            parentPort?.postMessage(output)
        }
    })
}

export {workerSend}