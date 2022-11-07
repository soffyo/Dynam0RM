import {
    AttributeDefinition,
    DynamoDBClient,
    GlobalSecondaryIndex,
    KeySchemaElement,
    ListTablesCommand,
    LocalSecondaryIndex, paginateListTables
} from '@aws-sdk/client-dynamodb'

import {
    DynamoDBDocumentClient,
    QueryCommand,
    ScanCommand,
    ServiceInputTypes,
    ServiceOutputTypes,
    paginateQuery,
    paginateScan
} from '@aws-sdk/lib-dynamodb'

import {TablesWM} from 'src/private'
import {splitToChunks, removeUndefined} from 'src/utils'
import {Class} from 'src/types'
import {Dynam0RMTable} from 'src/table'
import {Dynam0RMError} from 'src/validation/error'
import * as symbols from 'src/private/symbols'

export class Response<T> {
    public ok: boolean = false
    public output?: T
    public error?: Error
}

export abstract class Command<I extends ServiceInputTypes, O extends ServiceOutputTypes> {
    protected abstract readonly response: Response<O | O[]>

    readonly #PM = TablesWM(this.target)

    protected readonly tableName = this.#PM.get<string>(symbols.tableName)!
    protected readonly dynamoDBDocumentClient = this.#PM.get<DynamoDBDocumentClient>(symbols.client)!
    protected readonly dynamoDBClient = this.#PM.get<DynamoDBClient>(symbols.dynamodb)!
    protected readonly keySchema = this.#PM.get<KeySchemaElement[]>(symbols.keySchema)!
    protected readonly attributeDefinitions = this.#PM.get<AttributeDefinition[]>(symbols.attributeDefinitions)!
    protected readonly localSecondaryIndexes? = this.#PM.get<LocalSecondaryIndex[]>(symbols.localIndexes)
    protected readonly globalSecondaryIndexes? = this.#PM.get<GlobalSecondaryIndex[]>(symbols.globalIndexes)
    protected readonly timeToLive? = this.#PM.get<string>(symbols.ttl)
    protected readonly ignore? = this.#PM.get<string[]>(symbols.ignore)

    protected constructor(protected readonly target: Class<Dynam0RMTable>) {}

    public abstract send(): Promise<typeof this.response>

    public abstract commandInput: I | I[]

    protected logError(error: Error) {
        Dynam0RMError.log(this.target, this.constructor, error)
    }
}

export abstract class SimpleCommand<I extends ServiceInputTypes, O extends ServiceOutputTypes> extends Command<I, O> {
    protected abstract readonly command: any

    protected readonly response = new Response<O>()

    public get commandInput(): I {
        return this.command.input
    }

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

export abstract class PaginatedCommand<I extends ServiceInputTypes, O extends ServiceOutputTypes> extends SimpleCommand<I, O> {
    public async send() {
        let paginator, client, output, index
        try {
            if (this.command instanceof QueryCommand || this.command instanceof ScanCommand) {
                client = this.dynamoDBDocumentClient
                index = 0
                if (this.command instanceof QueryCommand) paginator = paginateQuery({client}, this.command.input)
                if (this.command instanceof ScanCommand) paginator = paginateScan({client}, this.command.input)
                if (paginator) for await (const page of paginator) {
                    if (index === 0) output = page
                    else {
                        if (page.Items) output?.Items?.push(...page.Items)
                        if (page.ScannedCount && output?.ScannedCount) output.ScannedCount += page.ScannedCount
                        if (page.Count && output?.Count) output.Count += page.Count
                    }
                    index++
                }
            } else if (this.command instanceof ListTablesCommand) {
                client = this.dynamoDBClient
                index = 0
                paginator = paginateListTables({client}, {})
                for await (const page of paginator) {
                    if (index === 0) output = page
                    else {
                        if (page.TableNames) output?.TableNames?.push(...page.TableNames)
                    }
                    index++
                }
            }
            this.response.output = output as O
            this.response.ok = true
        }
        catch (error: any) {
            this.response.ok = false
            this.response.error = error
            this.logError(error)
        }
        return this.response
    }
}

export abstract class BatchCommand<I extends ServiceInputTypes, O extends ServiceOutputTypes> extends Command<I, O> {
    protected abstract readonly commands: any[]

    protected readonly response = new Response<O[]>()

    public get commandInput() {
        return this.commands.map(c => c.input).flat(Infinity)
    }

    protected constructor(target: Class<Dynam0RMTable>, protected inputs: any[]) {
        super(target)
        this.inputs = splitToChunks(inputs, 25)
    }

    public async send() {
        // TODO: Consider retry the command if UnprocessedItems/UnprocessedKeys are returned.
        try {
            this.response.output = await Promise.all(this.commands.map(command => {
                return removeUndefined(this.dynamoDBDocumentClient.send<I, O>(command))
            }))
            this.response.ok = true
        }
        catch (error: any) {
            this.response.ok = false
            this.response.error = error
            this.logError(error)
        }
        return this.response
    }
}