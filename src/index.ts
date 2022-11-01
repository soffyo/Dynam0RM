import {Dynam0RMTable} from 'src/table'
import {LocalSecondaryIndex, GlobalSecondaryIndex, IndexProps, GlobalIndexProps} from 'src/decorators/property/indexes'
import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {Transaction} from 'src/commands/transaction/transactwrite'
import {Connection} from 'src/decorators/class/altconnection'
import * as Decorators from 'src/decorators'

export class Dynam0RMClient {
    public readonly Table = Dynam0RMTable
    public readonly Decorators = Decorators

    readonly #documentClient: DynamoDBDocumentClient

    public constructor(dynamoDBConfig: DynamoDBClientConfig) {
        const client = new DynamoDBClient(dynamoDBConfig)
        const documentClient = DynamoDBDocumentClient.from(client, {
            marshallOptions: {
                convertClassInstanceToMap: true,
                removeUndefinedValues: true,
            }
        })
        this.Decorators = {
            ...Decorators,
            Connection: ({tableName}: {tableName?: string} = {}) => Connection({
                client,
                documentClient,
                tableName
            })
        }
        this.#documentClient = documentClient
    }

    public static createLocalIndex<T extends Dynam0RMTable>(props?: IndexProps<T>) {
        return new LocalSecondaryIndex<T>(props)
    }

    public static createGlobalIndex<T extends Dynam0RMTable>(props?: GlobalIndexProps<T>) {
        return new GlobalSecondaryIndex<T>(props)
    }

    public createTransaction() {
        return new Transaction(this.#documentClient)
    }
}