import { PutCommand, PutCommandInput, PutCommandOutput } from "@aws-sdk/lib-dynamodb"
import { attributeNames } from "src/generators"
import { SimpleCommand } from "src/commands/command"
import { Class, JSObject } from "src/types"
import {Dynam0RMTable} from "src/table"

export class Put<T extends Dynam0RMTable> extends SimpleCommand<PutCommandInput, PutCommandOutput> {
    protected readonly command: PutCommand
    public constructor(target: Class<T>, Item: T) {
        super(target)
        const PK = this.keySchema[0]?.AttributeName
        const SK = this.keySchema[1]?.AttributeName
        let ConditionExpression = `attribute_not_exists (#${PK})`
        if (SK) ConditionExpression += ` AND attribute_not_exists (#${SK})`
        if (this.ignore?.length) for (const key in Item) {
            if (this.ignore.includes(key)) delete Item[key]
        }
        this.command = new PutCommand({
            TableName: this.tableName,
            ExpressionAttributeNames: attributeNames([PK, SK]),
            ConditionExpression,
            Item,
            ReturnConsumedCapacity: 'INDEXES'
        })
    }
}