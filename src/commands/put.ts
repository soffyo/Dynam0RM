import { PutCommand, PutCommandInput, PutCommandOutput } from "@aws-sdk/lib-dynamodb"
import { attributeNames } from "src/generators"
import { SimpleCommand } from "src/commands/command"
import { Class } from "src/types";

export class Put<T extends {[k:string]: any}> extends SimpleCommand<PutCommandInput, PutCommandOutput, T> {
    protected readonly command: PutCommand
    public constructor(target: Class, private Item: T) {
        super(target)
        const PK = this.keySchema[0]?.AttributeName
        const SK = this.keySchema[1]?.AttributeName
        let ConditionExpression = `attribute_not_exists (#${PK})`
        if (SK) ConditionExpression += ` AND attribute_not_exists (#${SK})`
        this.command = new PutCommand({
            TableName: this.tableName,
            ExpressionAttributeNames: attributeNames([PK, SK]),
            ConditionExpression,
            Item: { ...Item },
            ReturnConsumedCapacity: 'INDEXES'
        })
    }
    public async exec() {
        try {
            await this.send()
            this.response.output = { ...this.Item }
            this.response.message = 'Item has been put successfully'
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