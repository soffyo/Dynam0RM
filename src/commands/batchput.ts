import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from "@aws-sdk/lib-dynamodb"
import { BatchCommand } from "./command"

export class BatchPut<T> extends BatchCommand<T, BatchWriteCommandInput, BatchWriteCommandOutput> {
    protected readonly commands: BatchWriteCommand[] = []
    protected readonly unprocessedKey: keyof BatchWriteCommandOutput
    protected readonly contentKey?: keyof BatchWriteCommandOutput
    public constructor(target: object, Items: T[]) {
        super(Items.map(Item => ({ ...Item })))
        for (const input of this.inputs!) {
            this.commands.push(new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: input.map((Item: T) => ({
                        PutRequest: { Item }
                    }))
                }
            }))
        }
        this.unprocessedKey = 'UnprocessedItems'
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
        } finally {
            return this.response
        }
    }
}