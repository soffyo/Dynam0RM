import {
    CreateTableCommand,
    CreateTableCommandInput,
    CreateTableCommandOutput,
    ListTablesCommand,
    paginateListTables,
    UpdateTimeToLiveCommand,
    UpdateTimeToLiveCommandOutput
} from '@aws-sdk/client-dynamodb'
import { SimpleCommand } from './command'
import { removeUndefined } from 'src/utils'
import { CreateTableConfig, Class } from 'src/types'
import { Dynam0RXError } from 'src/validation/error'

type CreateTableOutput = CreateTableCommandOutput['TableDescription'] & Partial<Pick<UpdateTimeToLiveCommandOutput,'TimeToLiveSpecification'>>

export class CreateTable extends SimpleCommand<CreateTableCommandInput, CreateTableCommandOutput, CreateTableOutput> {
    protected command: CreateTableCommand
    constructor(target: Class, config?: CreateTableConfig) {
        super(target);
        (async () => {
            const listTablesCommand = new ListTablesCommand({})
            const paginator = paginateListTables({ client: this.dynamoDBClient }, listTablesCommand.input)
            for await (const page of paginator) {
                if (page?.TableNames?.includes(this.tableName)) {
                    throw new Dynam0RXError(`Table '${this.tableName}' already exists.`)
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
    public async exec() {
        try {
            const { TableDescription } = await this.send()
            this.response.output = TableDescription
            if (this.timeToLive) {
                const ttl = await this.dynamoDBClient.send(new UpdateTimeToLiveCommand({
                    TableName: this.tableName,
                    TimeToLiveSpecification: {
                        AttributeName: this.timeToLive,
                        Enabled: true
                    }
                }))
                this.response.output = { ...this.response.output, TimeToLiveSpecification: ttl?.TimeToLiveSpecification }
            }
            if (this.response.output) this.response.output = removeUndefined(this.response.output)
            this.response.message = `Table '${TableDescription?.TableName}' created successfully`
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error.name
            this.logError(error)
        } finally {
            return this.response
        }
    }
}