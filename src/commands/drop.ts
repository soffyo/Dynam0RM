import { DeleteTableCommand, DeleteTableCommandInput, DeleteTableCommandOutput } from "@aws-sdk/client-dynamodb"
import { SimpleCommand } from "./command"

export class Drop extends SimpleCommand<never, DeleteTableCommandInput, DeleteTableCommandOutput> {
    protected command: DeleteTableCommand
    constructor(target: object) {
        super(target)
        this.command = new DeleteTableCommand({ TableName: this.tableName })
    }
    public async exec() {
        try {
            const { TableDescription } = await this.send()
            this.response.message = `Table "${TableDescription?.TableName}" deleted successfully.`
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error
        } finally {
            return this.response
        }
    }
}