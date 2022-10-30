import {CreateTableCommand, CreateTableCommandInput, CreateTableCommandOutput, ListTablesCommand, paginateListTables} from '@aws-sdk/client-dynamodb'
import { SimpleCommand } from './command'
import { removeUndefined } from 'src/utils'
import { CreateTableConfig, Class } from 'src/types'
import { Dynam0RMError } from 'src/validation/error'
import {Dynam0RMTable} from "src/table";

export class CreateTable extends SimpleCommand<CreateTableCommandInput, CreateTableCommandOutput> {
    protected command: CreateTableCommand
    constructor(target: Class<Dynam0RMTable>, config?: CreateTableConfig) {
        super(target);
        (async () => {
            const listTablesCommand = new ListTablesCommand({})
            const paginator = paginateListTables({ client: this.dynamoDBClient }, listTablesCommand.input)
            for await (const page of paginator) {
                if (page?.TableNames?.includes(this.tableName)) {
                    throw new Dynam0RMError(`Table '${this.tableName}' already exists.`)
                }
            }
        })()
        this.command = new CreateTableCommand({
            BillingMode: config?.throughput ? 'PROVISIONED' : 'PAY_PER_REQUEST',
            TableClass: config?.infrequent ? 'STANDARD_INFREQUENT_ACCESS' : 'STANDARD',
            ProvisionedThroughput: config?.throughput ? { ReadCapacityUnits: config.throughput.read, WriteCapacityUnits: config.throughput.write } : undefined,
            TableName: this.tableName,
            KeySchema: this.keySchema,
            AttributeDefinitions: this.attributeDefinitions,
            LocalSecondaryIndexes: this.localSecondaryIndexes,
            GlobalSecondaryIndexes: this.globalSecondaryIndexes,
            StreamSpecification: {
                StreamEnabled: config?.stream !== undefined,
                StreamViewType: (function() {
                    switch (config?.stream) {
                        case 'new': return 'NEW_IMAGE'
                        case 'old': return 'OLD_IMAGE'
                        case 'both': return 'NEW_AND_OLD_IMAGES'
                        case 'keys-only': return 'KEYS_ONLY'
                    }
                })()
            }
        })
    }
}