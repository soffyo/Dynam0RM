import { AttributeDefinition, DynamoDBClient, GlobalSecondaryIndex, KeySchemaElement, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ServiceInputTypes, ServiceOutputTypes } from '@aws-sdk/lib-dynamodb'
import { mainPM } from "src/private"
import { splitArray } from 'src/utils'
import * as symbol from 'src/private/symbols'

export class Response<T> {
    public ok: boolean = false
    public message: string = 'No response received.'
    public output?: T
    public error?: Error
}

abstract class Command<O extends ServiceOutputTypes, R> {
    private readonly PM = mainPM(this.target)

    protected readonly tableName = this.PM.get<string>(symbol.tableName)!
    protected readonly dynamoDBDocumentClient = this.PM.get<DynamoDBDocumentClient>(symbol.client)!
    protected readonly dynamoDBClient = this.PM.get<DynamoDBClient>(symbol.dynamodb)!
    protected readonly keySchema = this.PM.get<KeySchemaElement[]>(symbol.keySchema)!
    protected readonly attributeDefinitions = this.PM.get<AttributeDefinition[]>(symbol.attributeDefinitions)!
    protected readonly localSecondaryIndexes = this.PM.get<LocalSecondaryIndex[]>(symbol.localIndexes)!
    protected readonly globalSecondaryIndexes = this.PM.get<GlobalSecondaryIndex[]>(symbol.globalIndexes)!

    protected readonly response = new Response<R>()

    protected constructor(protected readonly target: { new (...args: any[]): {} }) {}

    protected abstract send(): Promise<O|O[]>

    public abstract exec(): Promise<typeof this.response>
}

export abstract class SimpleCommand<T, I extends ServiceInputTypes,O extends ServiceOutputTypes, R = T> extends Command<O, R> {
    protected abstract readonly command: any

    protected constructor(target: { new (...args: any[]): {} }) {
        super(target)
    }

    protected send(): Promise<O> {
        return this.dynamoDBDocumentClient.send<I,O>(this.command)
    }
}

export abstract class BatchCommand<T, I extends ServiceInputTypes, O extends ServiceOutputTypes, R = T> extends Command<O, R> {
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

    protected send(): Promise<O[]> {
        return Promise.all(this.commands.map(command => this.dynamoDBDocumentClient.send<I,O>(command)))
    }
}