import {AttributeDefinition, DynamoDBClient, GlobalSecondaryIndex, KeySchemaElement, LocalSecondaryIndex} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient, ServiceInputTypes, ServiceOutputTypes} from '@aws-sdk/lib-dynamodb'
import {TablesWM} from 'src/private'
import {splitArray, removeUndefined} from 'src/utils'
import {Class} from 'src/types'
import {Dynam0RMTable} from 'src/table'
import {Dynam0RMError} from 'src/validation/error'
import * as symbols from 'src/private/symbols'

export class Response<T> {
    public ok: boolean = false
    public output?: T
    public error?: Error
}

export abstract class Command<O extends ServiceOutputTypes> {
    protected abstract readonly response: Response<O | O[]>

    private readonly PM = TablesWM(this.target)

    protected readonly tableName = this.PM.get<string>(symbols.tableName)!
    protected readonly dynamoDBDocumentClient = this.PM.get<DynamoDBDocumentClient>(symbols.client)!
    protected readonly dynamoDBClient = this.PM.get<DynamoDBClient>(symbols.dynamodb)!
    protected readonly keySchema = this.PM.get<KeySchemaElement[]>(symbols.keySchema)!
    protected readonly attributeDefinitions = this.PM.get<AttributeDefinition[]>(symbols.attributeDefinitions)!
    protected readonly localSecondaryIndexes? = this.PM.get<LocalSecondaryIndex[]>(symbols.localIndexes)
    protected readonly globalSecondaryIndexes? = this.PM.get<GlobalSecondaryIndex[]>(symbols.globalIndexes)
    protected readonly timeToLive? = this.PM.get<string>(symbols.ttl)
    protected readonly ignore? = this.PM.get<string[]>(symbols.ignore)

    protected constructor(protected readonly target: Class<Dynam0RMTable>) {}

    public abstract send(): Promise<typeof this.response>

    protected logError(error: Error) {
        Dynam0RMError.log(this.target, this.constructor, error)
    }
}

export abstract class SimpleCommand<I extends ServiceInputTypes, O extends ServiceOutputTypes> extends Command<O> {
    protected abstract readonly command: any

    protected readonly response = new Response<O>()

    protected constructor(target: Class<Dynam0RMTable>) {
        super(target)
    }

    public async send() {
        try {
            this.response.output = removeUndefined(await this.dynamoDBDocumentClient.send<I, O>(this.command))
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.error = error
            this.logError(error)
        }
        return this.response
    }
}

export abstract class BatchCommand<I extends ServiceInputTypes, O extends ServiceOutputTypes> extends Command<O> {
    protected abstract readonly commands: any[]

    protected readonly response = new Response<O[]>()
    protected constructor(target: Class<Dynam0RMTable>, protected inputs?: any[]) {
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

    public async send() {
        try {
            this.response.output = await Promise.all(this.commands.map(command => removeUndefined(this.dynamoDBDocumentClient.send<I, O>(command))))
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.error = error
            this.logError(error)
        }
        return this.response
    }
}