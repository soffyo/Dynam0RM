import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from "@aws-sdk/lib-dynamodb"
import { SimpleCommand } from "./command"
import { iterateConditionsArray } from "src/iterators"
import { PrimaryKey, Condition, Class } from "src/types"
import {Dynam0RMTable} from "src/table"

export class Delete <T extends Dynam0RMTable> extends SimpleCommand<DeleteCommandInput, DeleteCommandOutput> {
    protected command: DeleteCommand
    public constructor(target: Class<T>, Key: PrimaryKey<T>, conditions?: Condition<T>[]) {
        super(target)
        let ExpressionAttributeNames, ExpressionAttributeValues, ConditionExpressions: string[][] | undefined
        if (conditions?.length) {
            ExpressionAttributeNames = {}
            ExpressionAttributeValues = {}
            ConditionExpressions = []
            iterateConditionsArray(conditions, [], ExpressionAttributeNames, ExpressionAttributeValues, ConditionExpressions)
        }
        this.command = new DeleteCommand({
            Key,
            TableName: this.tableName,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            ConditionExpression: ConditionExpressions?.length ? ConditionExpressions?.map(block => `(${block.join(' AND ')})`).join(' OR ') : undefined,
            ReturnValues: 'ALL_OLD',
        })
    }
}