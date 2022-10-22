import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb'
import { BatchCommand } from './command'

export class BatchPut <T> extends BatchCommand <BatchWriteCommandInput, BatchWriteCommandOutput, T> {
    protected readonly commands: BatchWriteCommand[] = []
    public constructor(target: { new (...args: any[]): {} }, Items: T[]) {
        super(target, Items.map(Item => ({ ...Item })))
        if (this.inputs?.length) for (const input of this.inputs) {
            this.commands.push(new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: input.map((Item: T) => ({
                        PutRequest: { Item }
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
                this.response.message = `All items have been put. Items put: ${this.inputs?.slice().flat(Infinity).length}`
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