import { DeleteTableCommand, DeleteTableCommandInput, DeleteTableCommandOutput } from "@aws-sdk/client-dynamodb"
import { SimpleCommand } from "./command"

export class Drop extends SimpleCommand<DeleteTableCommandInput, DeleteTableCommandOutput, DeleteTableCommandOutput['TableDescription']> {
    protected command: DeleteTableCommand
    constructor(target: { new (...args: any[]): {} }) {
        super(target)
        this.command = new DeleteTableCommand({ TableName: this.tableName })
    }
    public async exec() {
        try {
            const { TableDescription } = await this.send()
            this.response.output = TableDescription
            this.response.message = `Table "${TableDescription?.TableName}" deleted successfully.`
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