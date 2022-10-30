import {GlobalSecondaryIndex, LocalSecondaryIndex} from "@aws-sdk/client-dynamodb"
import {QueryCommand, QueryCommandInput, QueryCommandOutput} from "@aws-sdk/lib-dynamodb"
import {iterateConditionsArray} from 'src/iterators'
import {handleConditions} from "src/generators"
import {SimpleCommand} from "src/commands/command"
import {Class, Condition, QueryObject} from 'src/types'
import {Dynam0RMTable} from "src/table";
import {isQuerySymbol} from "src/validation";

interface QueryConfig {
    Limit?: number
    IndexName?: string
    ScanIndexForward?: boolean
}

export class Query<T extends Dynam0RMTable> extends SimpleCommand<QueryCommandInput, QueryCommandOutput> {
    protected readonly command: QueryCommand
    constructor(target: Class<T>,
                hashValue: string | number,
                query?: QueryObject<string | number>,
                filter?: Condition<T>[],
                {Limit, IndexName, ScanIndexForward}: QueryConfig = {}) {
        super(target)
        const ExpressionAttributeValues = {}
        const ExpressionAttributeNames = {}
        const KeyConditionExpressions: string[] = []
        const FilterExpressions: string[][] = []
        let hashKey, rangeKey
        if (IndexName) {
            const joinedIndexes: GlobalSecondaryIndex[] | LocalSecondaryIndex[] = []
            if (this.localSecondaryIndexes) joinedIndexes.push(...this.localSecondaryIndexes)
            if (this.globalSecondaryIndexes) joinedIndexes.push(...this.globalSecondaryIndexes)
            for (const index of joinedIndexes) {
                if (index.IndexName === IndexName) {
                    if (index.KeySchema) {
                        hashKey = index.KeySchema[0]?.AttributeName
                        rangeKey = index.KeySchema[1]?.AttributeName ?? undefined
                    }
                }
            }
        } else {
            hashKey = this.keySchema[0]?.AttributeName
            rangeKey = this.keySchema[1]?.AttributeName
        }
        if (hashKey && hashValue) {
            Object.defineProperty(ExpressionAttributeNames, `#${hashKey}`, { value: hashKey, enumerable: true })
            Object.defineProperty(ExpressionAttributeValues, `:${hashKey}`, { value: hashValue, enumerable: true })
            KeyConditionExpressions.push(`#${hashKey} = :${hashKey}`)
        }
        if (query && rangeKey) {
            const symbol = Reflect.ownKeys(query)[0]
            if (isQuerySymbol(symbol)) {
                const value = query[symbol]
                Object.defineProperty(ExpressionAttributeNames, `#${rangeKey}`, { value: rangeKey, enumerable: true })
                handleConditions(symbol, value, [rangeKey], ExpressionAttributeValues, KeyConditionExpressions)
            }
        }
        if (filter) {
            iterateConditionsArray(filter, [], ExpressionAttributeNames, ExpressionAttributeValues, FilterExpressions)
        }
        this.command = new QueryCommand({
            TableName: this.tableName,
            IndexName,
            Limit,
            ScanIndexForward,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            KeyConditionExpression: KeyConditionExpressions.join(' AND '),
            FilterExpression: FilterExpressions.length ? FilterExpressions.map(block => `(${block.join(' AND ')})`).join(' OR ') : undefined,
            ReturnConsumedCapacity: 'INDEXES'
        })
    }
}