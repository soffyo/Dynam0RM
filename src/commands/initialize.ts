import { CreateTableCommand, CreateTableCommandInput, CreateTableCommandOutput, ListTablesCommand, paginateListTables } from '@aws-sdk/client-dynamodb'
import { SimpleCommand } from './command'
import { TableConfig } from 'src/types'

export class Initialize extends SimpleCommand<CreateTableCommandInput, CreateTableCommandOutput, CreateTableCommandOutput['TableDescription']> {
    protected command: CreateTableCommand
    constructor(target: { new (...args: any[]): {} }, config?: TableConfig) {
        super(target);
        (async () => {
            const listTablesCommand = new ListTablesCommand({})
            const paginator = paginateListTables({ client: this.dynamoDBClient }, listTablesCommand.input)
            for await (const page of paginator) {
                if (page?.TableNames?.includes(this.tableName)) {
                    throw new Error(`Table '${this.tableName}' already exists.`)
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
            GlobalSecondaryIndexes: this.globalSecondaryIndexes
        })
    }
    public async exec() {
        try {
            const { TableDescription } = await this.send()
            this.response.output = TableDescription
            this.response.message = `Table "${TableDescription?.TableName}" created successfully`
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error.name
        } finally {
            return this.response
        }
    }
}