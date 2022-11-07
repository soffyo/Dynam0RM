import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'

import {Dynam0RMTable} from 'src/table'
import {TransactWrite, BatchWrite, BatchGet} from 'src/commands'
import {Connection} from 'src/decorators/class/connection'

export class Dynam0RMClient {
    readonly #client: DynamoDBClient
    readonly #documentClient: DynamoDBDocumentClient
    readonly #config: DynamoDBClientConfig
    readonly #connection: (config?: {TableName?: string}) => ReturnType<typeof Connection>

    public get Client() {
        return this.#client
    }
    public get DocumentClient() {
        return this.#documentClient
    }
    public get Connection() {
        return this.#connection
    }

    public constructor(dynamoDBConfig: DynamoDBClientConfig) {
        this.#config = dynamoDBConfig
        this.#client = new DynamoDBClient(this.#config)
        this.#documentClient = DynamoDBDocumentClient.from(this.#client, {
            marshallOptions: {
                convertClassInstanceToMap: true,
                removeUndefinedValues: true
            }
        })

        this.#connection = ({TableName}: {TableName?: string} = {}) => Connection({
            clientConfig : this.#config,
            client : this.#client,
            documentClient : this.#documentClient,
            tableName: TableName
        })
    }

    public listTables() {
        // TODO
    }

    public createWriteTransaction() {
        return new TransactWrite(this.#documentClient)
    }

    public createReadTransaction() {
        // TODO
    }

    public createBatchWrite() {
        return new BatchWrite(this.#documentClient, this.#config)
    }

    public createBatchGet() {
        return new BatchGet(this.#documentClient)
    }

    public destroy() {
        this.#client.destroy()
        this.#documentClient.destroy()
    }
}

export {Dynam0RMTable as Table}