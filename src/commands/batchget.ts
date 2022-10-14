import { BatchGetCommandInput, BatchGetCommandOutput, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { BatchCommand } from 'src/commands/command'
import { Dynam0RX } from 'src/mixin'
import { PrimaryKeys } from 'src/types'

export class BatchGet<T> extends BatchCommand<T, BatchGetCommandInput, BatchGetCommandOutput, T[]> {
    protected commands: BatchGetCommand[] = []
    public constructor(target: object, Keys: (PrimaryKeys<T>)[]) {
        super(Keys)
        for (const input of this.inputs!) {
            this.commands.push(new BatchGetCommand({
                RequestItems: {
                    [this.tableName]: {
                        Keys: input
                    }
                }
            }))
        }
    }
    async exec() {
        try {
            const responses = []
            let unprocessed = 0
            for (const item of await this.send()) {
                if (item.Responses) responses.push(item.Responses[this.tableName])
                if (item.UnprocessedKeys) unprocessed += Object.keys(item.UnprocessedKeys).length
            }
            this.response.content = responses.slice().flat(Infinity).map(item => Dynam0RX.make(item)) as unknown as T[]
            if (unprocessed) {
                this.response.message = `${unprocessed} items have not been processed.`
            } else {
                this.response.message = `All items retrieved. Items retrieved: ${this.response.content.length}`
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