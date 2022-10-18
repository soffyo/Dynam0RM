import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput, DeleteCommand, DeleteCommandInput, DeleteCommandOutput, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { BatchCommand } from "./command"
import { PrimaryKeys } from "src/types"

export class BatchDelete<T> extends BatchCommand<T, BatchWriteCommandInput, BatchWriteCommandOutput> {
    protected commands: BatchWriteCommand[] = []
    constructor(target: { new (...args: any[]): {} }, Keys: (PrimaryKeys<T>)[]) {
        super(target, Keys)
        for (const input of this.inputs!) {
            this.commands.push(new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: input.map((Key: {}) => ({
                        DeleteRequest: { Key }
                    }))
                }
            }))
        }
    }
    public async exec() {
        try {
            let unprocessed = 0
            for (const item of await this.send()) {
                if (item.UnprocessedItems) unprocessed += Object.keys(item.UnprocessedItems).length
            }
            if (unprocessed) {
                this.response.message = `${unprocessed} items have not been processed.`
            } else {
                this.response.message = `All items have been deleted. Items deleted: ${this.inputs?.slice().flat(Infinity).length}`
            }
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