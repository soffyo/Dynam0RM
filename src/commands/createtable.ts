import {CreateTableCommand, CreateTableCommandInput, CreateTableCommandOutput} from '@aws-sdk/client-dynamodb'
import {SimpleCommand} from './command'
import {CreateTableConfig, Class} from 'src/types'
import {Dynam0RMTable} from 'src/table'

export class CreateTable extends SimpleCommand<CreateTableCommandInput, CreateTableCommandOutput> {
    protected command: CreateTableCommand
    constructor(target: Class<Dynam0RMTable>, config?: CreateTableConfig) {
        super(target)
        this.command = new CreateTableCommand({
            BillingMode: config?.throughput ? 'PROVISIONED' : 'PAY_PER_REQUEST',
            TableClass: config?.infrequent ? 'STANDARD_INFREQUENT_ACCESS' : 'STANDARD',
            ProvisionedThroughput: config?.throughput ? {
                ReadCapacityUnits: config.throughput.read,
                WriteCapacityUnits: config.throughput.write
            } : undefined,
            TableName: this.tableName,
            KeySchema: this.keySchema,
            AttributeDefinitions: this.attributeDefinitions,
            LocalSecondaryIndexes: this.localSecondaryIndexes,
            GlobalSecondaryIndexes: this.globalSecondaryIndexes,
            StreamSpecification: {
                StreamEnabled: config?.stream !== undefined,
                StreamViewType: config?.stream === 'new' ? 'NEW_IMAGE' :
                    config?.stream === 'old' ? 'OLD_IMAGE' :
                    config?.stream === 'both' ? 'NEW_AND_OLD_IMAGES' :
                    config?.stream === 'keys-only' ? 'KEYS_ONLY' :
                    undefined
            }
        })
    }
}