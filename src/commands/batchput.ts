import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb'
import { BatchCommand } from './command'
import {Class} from "src/types";
import {Dynam0RMTable} from "src/table";

export class BatchPut<T extends Dynam0RMTable> extends BatchCommand<BatchWriteCommandInput, BatchWriteCommandOutput> {
    protected readonly commands: BatchWriteCommand[] = []
    public constructor(target: Class<T>, Items: T[]) {
        super(target, Items.map(Item => ({ ...Item })))
        if (this.inputs?.length) for (const input of this.inputs) {
            this.commands.push(new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: input.map((Item: T) => {
                        if (this.ignore?.length) for (const key in Item) {
                            if (this.ignore.includes(key)) delete Item[key]
                        }
                        return {
                            PutRequest: { Item }
                        }
                    })
                }
            }))
        }
    }
}