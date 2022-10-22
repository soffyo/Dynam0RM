import { ScanCommand, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"
import { dynam0RXMixin } from "src/mixin"
import { SimpleCommand } from "./command"
import { iterateConditions } from "src/iterators"
import { Class, Condition } from 'src/types'

interface ScanConfig<T> {
    Limit?: number,
    IndexName?: string
    Filter?: boolean
}

export class Scan <T> extends SimpleCommand<ScanCommandInput, ScanCommandOutput, T[]> {
    protected readonly command: ScanCommand
    public constructor(target: Class, config?: ScanConfig<T>, filter?: Condition<T>) {
        super(target)
        let ExpressionAttributeNames, ExpressionAttributeValues
        const FilterExpressions: string[] = []
        if (filter) {
            ExpressionAttributeNames = {}
            ExpressionAttributeValues = {}
            iterateConditions(filter, [], ExpressionAttributeNames, ExpressionAttributeValues, FilterExpressions)
        }
        this.command = new ScanCommand({
            TableName: this.tableName,
            Limit: config?.Limit,
            IndexName: config?.IndexName,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            FilterExpression: FilterExpressions.length ? FilterExpressions.join(' AND ') : undefined
        })
    }
    public async exec() {
        try {
            const { Items } = await this.send()
            this.response.output = Items?.map(item => (dynam0RXMixin(this.target)).make(item)) as T[]
            this.response.message = 'Table scanned successfully.'
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