import {ScanCommand, ScanCommandInput, ScanCommandOutput} from "@aws-sdk/lib-dynamodb"
import {PaginatedCommand} from './command'
import {iterateConditionsArray} from 'src/iterators'
import {Class, Condition} from 'src/types'
import {Dynam0RMTable} from 'src/table'

interface ScanConfig {
    Limit?: number
    IndexName?: string
}

export class Scan <T extends Dynam0RMTable> extends PaginatedCommand<ScanCommandInput, ScanCommandOutput> {
    protected readonly command: ScanCommand
    public constructor(target: Class<T>, filter?: Condition<T>[], {Limit, IndexName}: ScanConfig = {}) {
        super(target)
        let ExpressionAttributeNames, ExpressionAttributeValues
        const FilterExpressions: string[][] = []
        if (filter) {
            ExpressionAttributeNames = {}
            ExpressionAttributeValues = {}
            iterateConditionsArray(filter, [], ExpressionAttributeNames, ExpressionAttributeValues, FilterExpressions)
        }
        this.command = new ScanCommand({
            TableName: this.tableName,
            Limit,
            IndexName,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            FilterExpression: FilterExpressions.length ? FilterExpressions.map(block => `(${block.join(' AND ')})`).join(' OR ') : undefined
        })
    }
}