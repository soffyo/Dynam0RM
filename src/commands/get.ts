import { GetCommand, GetCommandInput, GetCommandOutput } from "@aws-sdk/lib-dynamodb"
import { SimpleCommand } from 'src/commands/command'
import { PrimaryKeys } from "src/types"
import { dynam0RXMixin } from "src/mixin"

export class Get<T> extends SimpleCommand<GetCommandInput, GetCommandOutput, T> {
    protected command: GetCommand
    public constructor(target: { new (...args: any[]): {} }, Key: PrimaryKeys<T>) {
        super(target)
        this.command = new GetCommand({ TableName: this.tableName, Key })
    }
    async exec() {
        try {
            const { Item } = await this.send()
            if (Item) {
                this.response.output = dynam0RXMixin(this.target).make(Item) as T
                this.response.message = 'Item retrieved successfully.'
            } else {
                this.response.message = 'No Item found.'
            }
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