import { AttributeDefinition, DynamoDBClient, GlobalSecondaryIndex, KeySchemaElement, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ServiceInputTypes, ServiceOutputTypes } from '@aws-sdk/lib-dynamodb'
import { mainPM } from 'src/private'
import { splitArray } from 'src/utils'
import { Class } from 'src/types'
import * as symbols from 'src/private/symbols'

export class Response<T> {
    public ok: boolean = false
    public message: string = 'No response received.'
    public output?: T
    public error?: Error
}

abstract class Command<O extends ServiceOutputTypes, R> {
    private readonly PM = mainPM(this.target)

    protected readonly tableName = this.PM.get<string>(symbols.tableName)!
    protected readonly dynamoDBDocumentClient = this.PM.get<DynamoDBDocumentClient>(symbols.client)!
    protected readonly dynamoDBClient = this.PM.get<DynamoDBClient>(symbols.dynamodb)!
    protected readonly keySchema = this.PM.get<KeySchemaElement[]>(symbols.keySchema)!
    protected readonly attributeDefinitions = this.PM.get<AttributeDefinition[]>(symbols.attributeDefinitions)!
    protected readonly localSecondaryIndexes? = this.PM.get<LocalSecondaryIndex[]>(symbols.localIndexes)
    protected readonly globalSecondaryIndexes? = this.PM.get<GlobalSecondaryIndex[]>(symbols.globalIndexes)
    protected readonly timeToLive? = this.PM.get<string>(symbols.ttl)

    protected readonly response = new Response<R>()

    protected constructor(protected readonly target: Class) {}

    protected abstract send(): Promise<O|O[]>

    public abstract exec(): Promise<typeof this.response>

    protected logError(error: Error) {
        console.error(`Dynam0RX: [Table: '${this.tableName}'] -> ${this.constructor.name} -> ${error.name} -> ${error.message}`)
    }
}

export abstract class SimpleCommand<I extends ServiceInputTypes,O extends ServiceOutputTypes, T> extends Command<O, T> {
    protected abstract readonly command: any

    protected constructor(target: Class) {
        super(target)
    }

    protected send(): Promise<O> {
        return this.dynamoDBDocumentClient.send<I,O>(this.command)
    }
}

export abstract class BatchCommand<I extends ServiceInputTypes, O extends ServiceOutputTypes, T> extends Command<O, T> {
    protected abstract readonly commands: any[]

    protected constructor(target: { new (...args: any[]): {} }, protected inputs?: any[]) {
        super(target)
        if (inputs) if (inputs.length > 25) {
            const split: any[] = []
            for (const input of splitArray(inputs, 25)) {
                split.push(input)
            }
            this.inputs = split
        } else {
            this.inputs = [inputs]
        }
    }

    protected async send({ parallel }: { parallel?: boolean } = { parallel: true }): Promise<O[]> {
        if (parallel) {
            return Promise.all(this.commands.map(command => this.dynamoDBDocumentClient.send<I,O>(command)))
        } else {
            const responses: O[] = []
            for (const command of this.commands) {
                responses.push(await this.dynamoDBDocumentClient.send(command))
            }
            return responses
        }
    }
}