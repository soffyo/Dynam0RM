import { GlobalSecondaryIndex, LocalSecondaryIndex } from "@aws-sdk/client-dynamodb"
import { QueryCommand, QueryCommandInput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb"
import { handleConditions } from "src/generators"
import { dynam0RXMixin } from "src/mixin"
import { isObject } from "src/utils"
import { SimpleCommand } from "src/commands/command"
import { Query as TQuery } from 'src/types'
import * as symbols from 'src/private/symbols'

interface QueryConfig {
    Limit?: number
    IndexName?: string
    ScanIndexForward?: boolean
    filter?: boolean
}

export class Query<T> extends SimpleCommand<T, QueryCommandInput, QueryCommandOutput, T[]> {
    protected readonly command: QueryCommand
    constructor(target: { new (...args: any[]): {} }, query: TQuery<T>, config?: QueryConfig) {
        super(target)
        const ExpressionAttributeNames = {}
        const ExpressionAttributeValues = {}
        const KeyConditionExpressions: string[] = []
        const FilterExpressions: string[] = []
        function addPartitionKey(key: string, value: any) {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
            KeyConditionExpressions.push(`(#${key} = :${key})`)
        }
        function addSortKey(key: string, value: any) {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            if (isObject(value)) {
                for (const symbol of Object.getOwnPropertySymbols(value)) {
                    handleConditions(symbol, value[symbol], [key], ExpressionAttributeValues, KeyConditionExpressions)
                }
            }
        }
        function addFilterKey(key: string, value: any) {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            if (isObject(value)) {
                for (const symbol of Object.getOwnPropertySymbols(value)) {
                    if (Object.keys(symbols.query).some(k => (symbols.query as any)[k] === symbol)) {
                        handleConditions(symbol, value[symbol], [key], ExpressionAttributeValues, FilterExpressions)
                    }
                }
            }
        }
        (() => {
            let PK, SK
            if (config?.IndexName) {
                const joinedIndexes: GlobalSecondaryIndex[]|LocalSecondaryIndex[] = []
                if (this.localSecondaryIndexes) joinedIndexes.push(...this.localSecondaryIndexes)
                if (this.globalSecondaryIndexes) joinedIndexes.push(...this.globalSecondaryIndexes)
                for (const index of joinedIndexes) {
                    if (index.IndexName === config?.IndexName) {
                        if (index.KeySchema) {
                            PK = index.KeySchema[0].AttributeName
                            SK = index.KeySchema[1]?.AttributeName ?? undefined
                        }
                    }
                }
            } else {
                PK = this.keySchema[0].AttributeName
                SK = this.keySchema[1].AttributeName
            }
            for (const key of Object.keys(query)) {
                if (key === PK) addPartitionKey(key, query[key as keyof typeof query])
                else if (key === SK) addSortKey(key, query[key as keyof typeof query])
                else {
                    if (config?.filter) addFilterKey(key, query[key as keyof typeof query])
                    else addPartitionKey(key, query[key as keyof typeof query])
                }
            }
        })()
        this.command = new QueryCommand({
            TableName: this.tableName,
            IndexName: config?.IndexName,
            Limit: config?.Limit,
            ScanIndexForward: config?.ScanIndexForward,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            KeyConditionExpression: [...new Set(KeyConditionExpressions)].join(' AND '),
            FilterExpression: FilterExpressions.length ? [...new Set(FilterExpressions)].join(' AND ') : undefined,
        })
    }
    public async exec() {
        try {
            const { Items, Count } = await this.send()
            this.response.output = Items?.map(item => dynam0RXMixin(this.target).make(item)) as T[]
            this.response.message = `Query result returned ${Count} Items`
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