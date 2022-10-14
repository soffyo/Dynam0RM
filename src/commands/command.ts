import { AttributeDefinition, DynamoDBClient, GlobalSecondaryIndex, KeySchemaElement, LocalSecondaryIndex } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ServiceInputTypes, ServiceOutputTypes } from '@aws-sdk/lib-dynamodb'
import { mainPM } from "src/private"
import { splitArray } from 'src/utils'
import * as symbol from 'src/definitions/symbols'

export class Response<T> {
    public ok: boolean = false
    public message: string = 'No response received.'
    public content?: T
    public error?: Error
}

abstract class Command<O extends ServiceOutputTypes, R> {
    private readonly PM = mainPM(this.target)

    protected readonly tableName: string = this.PM.get(symbol.tableName)
    protected readonly dynamoDBDocumentClient: DynamoDBDocumentClient = this.PM.get(symbol.client)
    protected readonly dynamoDBClient: DynamoDBClient = this.PM.get(symbol.dynamodb)
    protected readonly keySchema: KeySchemaElement[] = this.PM.get(symbol.keySchema)
    protected readonly attributeDefinitions: AttributeDefinition[] = this.PM.get(symbol.attributeDefinitions)
    protected readonly localSecondaryIndexes: LocalSecondaryIndex[] = this.PM.get(symbol.localIndexes)
    protected readonly globalSecondaryIndexes: GlobalSecondaryIndex[] = this.PM.get(symbol.globalIndexes)

    protected readonly response = new Response<R>()

    constructor(private readonly target: object) {}

    protected abstract send(): Promise<O|O[]>

    public abstract exec(): Promise<typeof this.response>
}

export abstract class SimpleCommand<T, I extends ServiceInputTypes,O extends ServiceOutputTypes, R = T> extends Command<O, R> {
    protected abstract readonly command: any

    constructor(target: object) {
        super(target)
    }

    protected async send(): Promise<O> {
        return await this.dynamoDBDocumentClient.send<I,O>(this.command)
    }
}

export abstract class BatchCommand<T, I extends ServiceInputTypes, O extends ServiceOutputTypes, R = T> extends Command<O, R> {
    protected abstract readonly commands: any[]

    protected constructor(target: object, protected inputs?: any[]) {
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

    protected async send(): Promise<O[]> {
        const responses: any[] = []
        for (const command of this.commands) {
            const response = await this.dynamoDBDocumentClient.send<I,O>(command)
            responses.push(response)
        }
        return responses
    }
}