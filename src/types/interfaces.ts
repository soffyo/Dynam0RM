import {DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'

export interface CreateTableConfig {
    throughput?: {read: number; write: number}
    infrequent?: boolean
    stream?: 'new' | 'old' | 'both' | 'keys-only'
}

export interface DBData {
    ClientConfig: DynamoDBClientConfig
    TableName: string
}